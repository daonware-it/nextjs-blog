import React from "react";

export interface SpacingBlockProps {
  height?: number; // px
}

const SpacingBlock: React.FC<SpacingBlockProps> = ({ height = 32 }) => {
  return <div style={{ height, width: "100%" }} />;
};

export default SpacingBlock;
