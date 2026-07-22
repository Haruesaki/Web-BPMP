import React, { useEffect, useRef, useMemo, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  // Inti
  Essentials,
  Paragraph,
  Autoformat,
  Clipboard,
  PasteFromOffice,
  SelectAll,
  Undo,
  // Sumber / HTML
  SourceEditing,
  GeneralHtmlSupport,
  FindAndReplace,
  // Format teks
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  RemoveFormat,
  // Font
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  // Paragraf / heading / gaya
  Heading,
  Style,
  Alignment,
  // List & indent
  List,
  TodoList,
  ListProperties,
  Indent,
  IndentBlock,
  // Blok
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  PageBreak,
  SpecialCharacters,
  SpecialCharactersEssentials,
  // Tautan & media
  Link,
  AutoLink,
  LinkImage,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageInsert,
  AutoImage,
  ImageUpload,
  MediaEmbed,
  // Tabel
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { CustomUploadAdapterPlugin } from '../../../utils/CustomUploadAdapter';
import { InsertDocumentPlugin } from '../../../utils/InsertDocumentPlugin';
import axiosInstance from '../../../api/axiosInstance';
import './CKEditorComponent.css';

const editorConfig = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Autoformat, Clipboard, PasteFromOffice, SelectAll, Undo,
    SourceEditing, GeneralHtmlSupport, FindAndReplace,
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Code, RemoveFormat,
    FontSize, FontFamily, FontColor, FontBackgroundColor,
    Heading, Style, Alignment,
    List, TodoList, ListProperties, Indent, IndentBlock,
    BlockQuote, CodeBlock, HorizontalLine, PageBreak, SpecialCharacters, SpecialCharactersEssentials,
    Link, AutoLink, LinkImage,
    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, AutoImage, ImageUpload,
    MediaEmbed,
    Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, TableCaption,
  ],
  toolbar: {
    items: [
      'sourceEditing', 'findAndReplace', 'selectAll',
      '|', 'undo', 'redo',
      '|', 'heading', 'style',
      '|', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
      '-',
      'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'removeFormat',
      '|', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
      '|', 'alignment', 'blockQuote', 'codeBlock',
      '|', 'link', 'insertImage', 'insertDocument', 'insertTable', 'mediaEmbed',
      '|', 'horizontalLine', 'specialCharacters', 'pageBreak',
    ],
    shouldNotGroupWhenFull: true,
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
    ],
  },
  fontSize: {
    options: [10, 12, 14, 'default', 18, 20, 24, 28, 32],
    supportAllValues: true,
  },
  fontFamily: { supportAllValues: true },
  style: {
    definitions: [
      { name: 'Italic Title', element: 'p', classes: ['article-italic-title'] },
      { name: 'Subtitle', element: 'p', classes: ['article-subtitle'] },
      { name: 'Special Container', element: 'p', classes: ['article-special-container'] },
      { name: 'Marker', element: 'span', classes: ['article-marker'] },
      { name: 'Big', element: 'span', classes: ['article-big'] },
      { name: 'Small', element: 'span', classes: ['article-small'] },
      { name: 'Computer Code', element: 'span', classes: ['article-code'] },
      { name: 'Keyboard Phrase', element: 'span', classes: ['article-kbd'] },
      { name: 'Cited Work', element: 'span', classes: ['article-cite'] },
      { name: 'Inline Quotation', element: 'span', classes: ['article-quote'] },
    ],
  },
  image: {
    toolbar: [
      'imageTextAlternative', 'toggleImageCaption',
      '|', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
      '|', 'resizeImage',
    ],
  },
  table: {
    contentToolbar: [
      'tableColumn', 'tableRow', 'mergeTableCells',
      'tableProperties', 'tableCellProperties',
    ],
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
  },
  htmlSupport: {
    allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
  },
  placeholder: 'Tulis isi konten di sini...',
};

const getAuthToken = () => {
  try {
    const session = sessionStorage.getItem('adminSession');
    return session ? JSON.parse(session)?.token || '' : '';
  } catch {
    return '';
  }
};

const UPLOAD_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/gambar`;

const CKEditorComponent = ({ data, onChange, thumbnailUrl, onThumbnailChange }) => {
  const editorRef = useRef(null);
  const [compressMsg, setCompressMsg] = useState('');

  const finalEditorConfig = useMemo(
    () => ({
      ...editorConfig,
      extraPlugins: [
        CustomUploadAdapterPlugin(UPLOAD_URL, `Bearer ${getAuthToken()}`, setCompressMsg),
        InsertDocumentPlugin('/api/upload/dokumen'),
      ]
    }),
    []
  );

  useEffect(() => {
    const EDGE_TOP = 110;
    const EDGE_BOTTOM = 190;
    const MIN_SPEED = 8;
    const MAX_SPEED = 28;
    let pointerY = 0;
    let active = false;
    let raf = null;

    const ramp = (t) => MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0, Math.min(1, t));

    const step = () => {
      if (!active) {
        raf = null;
        return;
      }
      const h = window.innerHeight;
      let dy = 0;
      const distTop = pointerY;
      const distBottom = h - pointerY;
      if (distTop < EDGE_TOP) {
        dy = -ramp(1 - distTop / EDGE_TOP);
      } else if (distBottom < EDGE_BOTTOM) {
        dy = ramp(1 - distBottom / EDGE_BOTTOM);
      }
      if (dy !== 0) window.scrollBy(0, dy);
      raf = requestAnimationFrame(step);
    };

    const onDragOver = (e) => {
      pointerY = Math.max(0, Math.min(e.clientY, window.innerHeight));
      if (!active) {
        active = true;
        if (!raf) raf = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      active = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('drop', stop, true);
    window.addEventListener('dragend', stop, true);
    return () => {
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('drop', stop, true);
      window.removeEventListener('dragend', stop, true);
      stop();
    };
  }, []);

  // Cleanup on unmount: destroy the CKEditor JS instance and remove orphaned
  // DOM elements (.ck-body-wrapper) that CKEditor appends to <body> outside
  // React's tree. Using useEffect (not useLayoutEffect) so the <CKEditor>
  // React component can destroy its own internal state first.
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch (_) {}
        editorRef.current = null;
      }
      document.querySelectorAll('.ck-body-wrapper').forEach((el) => {
        el.removeAttribute('data-lenis-prevent');
        el.remove();
      });
    };
  }, []);

  const handleEditorReady = (editor) => {
    editorRef.current = editor;

    const markLenisPrevent = () =>
      document
        .querySelectorAll('.ck-body-wrapper')
        .forEach((el) => el.setAttribute('data-lenis-prevent', 'true'));
    markLenisPrevent();

    if (editor.plugins.has('Dialog')) {
      const dialog = editor.plugins.get('Dialog');

      dialog.on('change:id', (evt, name, id) => {
        if (id) markLenisPrevent();
      });

      editor.ui.view.toolbar.items.forEach((item) => {
        if (item && item.panelView && typeof item.on === 'function') {
          item.on('change:isOpen', (evt, name, isOpen) => {
            if (isOpen && dialog.id) dialog.hide();
          });
        }
      });
    }
  };

  return (
    <div className="ckeditor-container" style={{ position: 'relative' }}>
      {compressMsg && (
        <div style={{ position: 'absolute', top: '30px', right: '15px', backgroundColor: '#3b82f6', color: 'white', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          {compressMsg}
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div className="pd-editor">
        <CKEditor
          editor={ClassicEditor}
          config={finalEditorConfig}
          data={data}
          onReady={handleEditorReady}
          onChange={(event, editor) => onChange(editor.getData())}
        />
      </div>
    </div>
  );
};

export default CKEditorComponent;