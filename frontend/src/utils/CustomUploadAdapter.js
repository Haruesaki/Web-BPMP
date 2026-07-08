import imageCompression from 'browser-image-compression';

export default class CustomUploadAdapter {
    constructor(loader, uploadUrl, authHeader, setCompressMsg) {
        this.loader = loader;
        this.uploadUrl = uploadUrl;
        this.authHeader = authHeader;
        this.setCompressMsg = setCompressMsg;
    }

    upload() {
        return this.loader.file
            .then(file => new Promise(async (resolve, reject) => {
                let fileToUpload = file;
                const MAX_SIZE_MB = 2; // Batas maksimal ukuran 2MB
                const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
                
                // Jika ukuran file melebihi batas 2 MB, lakukan kompresi asinkron di sisi klien
                if (file.size > MAX_SIZE_BYTES) {
                    this.setCompressMsg(`Sedang mengompres gambar ${file.name} karena ukuran di atas 2 MB...`);
                    const options = {
                        maxSizeMB: MAX_SIZE_MB,
                        maxWidthOrHeight: 1600, // Menyesuaikan batas lebar di backend agar resolusi tidak pecah (optimal)
                        useWebWorker: true,
                        initialQuality: 0.8 // Kompresi dengan retensi resolusi yang baik
                    };
                    try {
                        fileToUpload = await imageCompression(file, options);
                        this.setCompressMsg(''); // hapus pesan setelah kompresi berhasil
                    } catch (error) {
                        this.setCompressMsg('');
                        console.error('Error saat kompresi gambar:', error);
                        return reject('Gagal mengompres gambar.');
                    }
                }

                // Setelah siap, kirim file ke server
                this._sendRequest(fileToUpload, resolve, reject);
            }));
    }

    abort() {
        if (this.xhr) {
            this.xhr.abort();
        }
        if (this.setCompressMsg) {
            this.setCompressMsg('');
        }
    }

    _sendRequest(file, resolve, reject) {
        const xhr = this.xhr = new XMLHttpRequest();
        xhr.open('POST', this.uploadUrl, true);
        if (this.authHeader) {
            xhr.setRequestHeader('Authorization', this.authHeader);
        }
        xhr.responseType = 'json';

        xhr.addEventListener('error', () => reject('Network Error (Gagal menghubungi server).'));
        xhr.addEventListener('abort', () => reject());
        xhr.addEventListener('load', () => {
            const response = xhr.response;
            if (!response || response.error) {
                return reject(response && response.error ? response.error.message : 'Gagal mengunggah berkas.');
            }
            // CKEditor expects the URL in the { default: 'url' } format (atau format lain sesuai standar v5)
            // Backend BPMP mengembalikan { url: '...' }
            resolve({ default: response.url });
        });

        if (xhr.upload) {
            xhr.upload.addEventListener('progress', evt => {
                if (evt.lengthComputable) {
                    this.loader.uploadTotal = evt.total;
                    this.loader.uploaded = evt.loaded;
                }
            });
        }

        const data = new FormData();
        data.append('upload', file);
        xhr.send(data);
    }
}

export function CustomUploadAdapterPlugin(uploadUrl, authHeader, setCompressMsg) {
    return function(editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new CustomUploadAdapter(loader, uploadUrl, authHeader, setCompressMsg);
        };
    }
}
