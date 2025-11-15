import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useState, useEffect } from "react";

/**
 * RichTextEditor Component - Reusable rich text editor using Quill
 * @param {string} title - Label for the editor field
 * @param {string} value - Current HTML content
 * @param {function} onChange - Callback function when content changes (property, value)
 * @param {string} property - Property name for the field
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Is field required (default: false)
 * @param {boolean} disabled - Disable editor (default: false)
 */
const RichTextEditor = ({
  title = "Nội dung",
  value = "",
  onChange,
  property = "",
  placeholder = "Nhập nội dung...",
  required = false,
  disabled = false,
}) => {
  const [editorValue, setEditorValue] = useState("");

  // Update editor value when prop changes
  useEffect(() => {
    setEditorValue(value || "");
  }, [value]);

  // Handle content change
  const handleChange = (content) => {
    setEditorValue(content);
    if (onChange) {
      onChange(property, content);
    }
  };

  // Quill modules configuration - basic formatting options
  const modules = {
    toolbar: [
      // Font and size
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],

      // Text formatting
      ["bold", "italic", "underline"],

      // Lists
      [{ list: "ordered" }, { list: "bullet" }],

      // Text alignment
      [{ align: [] }],

      // Clear formatting
      ["clean"],
    ],
  };

  // Quill formats to allow
  const formats = [
    "font",
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "align",
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        {title}
        {required && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
      </label>

      <div
        style={{
          border: disabled ? "1px solid #d9d9d9" : "1px solid #d9d9d9",
          borderRadius: "8px",
          backgroundColor: disabled ? "#f5f5f5" : "white",
        }}
      >
        <ReactQuill
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{
            minHeight: "200px",
          }}
        />
      </div>

      <style>{`
        .ql-container {
          min-height: 200px;
          font-size: 14px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        
        .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background-color: #fafafa;
        }
        
        .ql-editor {
          min-height: 200px;
        }
        
        .ql-editor.ql-blank::before {
          color: #bfbfbf;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
