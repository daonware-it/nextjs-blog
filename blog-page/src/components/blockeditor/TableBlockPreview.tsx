import React from "react";
import styles from "./blocks/TableBlock.module.css";
import { Block } from "./BlockTypes";

interface TableBlockPreviewProps {
  block: Block;
}

// Hilfstypen für TableBlock
interface TableBlockData {
  rows: number;
  cols: number;
  data: { text: string; bold: boolean; align: string }[][];
}
function isTableBlockData(obj: any): obj is TableBlockData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.rows === "number" &&
    typeof obj.cols === "number" &&
    Array.isArray(obj.data)
  );
}

const TableBlockPreview: React.FC<TableBlockPreviewProps> = ({ block }) => {
  const data = block.data;
  if (!isTableBlockData(data)) {
    return (
      <div style={{ color: "#888", fontStyle: "italic", padding: 12 }}>
        Keine Tabelle definiert.
      </div>
    );
  }
  // Nur reine Vorschau: keine Editier-Controls, keine Checkboxen, keine Selects
  return (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table className={styles.tableBlock}>
        <thead>
          <tr>
            {data.data[0]?.map((cell, colIdx) => (
              <th
                key={colIdx}
                style={{
                  textAlign:
                    cell.align === "left" || cell.align === "center" || cell.align === "right"
                      ? cell.align
                      : "left",
                }}
              >
                {cell.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.slice(1).map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    // Keine globale Schriftstärke mehr, nur HTML im Textfeld bestimmt das Aussehen
                    textAlign:
                      cell.align === "left" || cell.align === "center" || cell.align === "right"
                        ? cell.align
                        : "left",
                  }}
                >
                  {/* Zelleninhalt als HTML rendern, damit z.B. <b>INHALT</b> korrekt angezeigt wird */}
                  {cell.text ? (
                    <span dangerouslySetInnerHTML={{ __html: cell.text }} />
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableBlockPreview;
