import React from "react";
import "./DefaultContent.css";
import WOWOK from '../../../../assets/source/WOWOK.jpg';
import parse from "html-react-parser"; // Import library

const DefaultContent = ({
  contentHtml = `
  <p>Nulla maximus eu arcu nec consequat. Donec eget iaculis lectus. Etiam in lectus scelerisque, elementum justo sed, tempor justo. Aenean consectetur ex enim, eu luctus augue suscipit efficitur. Donec egestas lectus sit amet blandit mollis. Phasellus et sapien mollis, consequat lorem porttitor, pharetra leo. Proin at laoreet leo, vel imperdiet urna. Maecenas interdum accumsan tortor a dictum. Fusce sodales, lacus eget facilisis egestas, lectus tellus vulputate dui, vitae viverra diam odio eget leo. Pellentesque egestas sit amet nisi dignissim pulvinar. Vestibulum euismod pharetra turpis, efficitur venenatis dui sollicitudin quis. Aenean gravida pellentesque velit, in commodo est lobortis sit amet. Suspendisse sed congue diam, in porttitor leo.
Pellentesque vel nunc nec mauris viverra tincidunt eu ut velit. Vestibulum ullamcorper quam vitae ligula scelerisque, vel efficitur urna consequat. Sed finibus imperdiet fermentum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Proin ut scelerisque dui. Aliquam pulvinar convallis tincidunt. Morbi vestibulum auctor ligula ac convallis. Etiam risus odio, laoreet eu commodo non, venenatis in dolor. Cras euismod turpis vitae laoreet tempus. Nullam mi lorem, volutpat at congue a, laoreet placerat metus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam erat volutpat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum facilisis volutpat eros, a ornare ante. Cras ultricies, diam non feugiat malesuada, neque dolor egestas sem, a faucibus risus nunc in nunc.
</p>
  <img src={WOWOK} alt="Placeholder Image">
  <p>Nulla maximus eu arcu nec consequat. Donec eget iaculis lectus. Etiam in lectus scelerisque, elementum justo sed, tempor justo. Aenean consectetur ex enim, eu luctus augue suscipit efficitur. Donec egestas lectus sit amet blandit mollis. Phasellus et sapien mollis, consequat lorem porttitor, pharetra leo. Proin at laoreet leo, vel imperdiet urna. Maecenas interdum accumsan tortor a dictum. Fusce sodales, lacus eget facilisis egestas, lectus tellus vulputate dui, vitae viverra diam odio eget leo. Pellentesque egestas sit amet nisi dignissim pulvinar. Vestibulum euismod pharetra turpis, efficitur venenatis dui sollicitudin quis. Aenean gravida pellentesque velit, in commodo est lobortis sit amet. Suspendisse sed congue diam, in porttitor leo.
Pellentesque vel nunc nec mauris viverra tincidunt eu ut velit. Vestibulum ullamcorper quam vitae ligula scelerisque, vel efficitur urna consequat. Sed finibus imperdiet fermentum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Proin ut scelerisque dui. Aliquam pulvinar convallis tincidunt. Morbi vestibulum auctor ligula ac convallis. Etiam risus odio, laoreet eu commodo non, venenatis in dolor. Cras euismod turpis vitae laoreet tempus. Nullam mi lorem, volutpat at congue a, laoreet placerat metus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam erat volutpat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum facilisis volutpat eros, a ornare ante. Cras ultricies, diam non feugiat malesuada, neque dolor egestas sem, a faucibus risus nunc in nunc.
</p>`,
}) => {
  // Fungsi untuk membungkus elemen <img>
  const replaceImagesWithFrames = (node) => {
    if (node.type === "tag" && node.name === "img") {
      const imgSrc = node.attribs.src;

      const cleanedAttribs = { ...node.attribs };
      delete cleanedAttribs.width;
      delete cleanedAttribs.height;
      delete cleanedAttribs.style;

      return (
        <div className="image-frame">
          <img {...cleanedAttribs} src={imgSrc} alt={node.attribs.alt || ""} />
        </div>
      );
    }
    return node;
  };
  const parsedContent = parse(contentHtml, {
    replace: replaceImagesWithFrames,
  });

  return (
    <div className="content-type-section default-content">
      <div className="default-banner-wrapper">
        <h1 className="default-banner-title">Judul Halaman</h1>
      </div>
      <div className="default-description-container">
        {/* Render konten HTML yang sudah di-parse dan diubah */}
        {parsedContent}
      </div>
    </div>
  );
};

export default DefaultContent;
