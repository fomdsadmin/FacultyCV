import React from "react";

const LINK_CLASS = "font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer";
const LINK_STYLE = { textDecorationThickness: "2px" };

const ExternalLink = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
      style={LINK_STYLE}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
