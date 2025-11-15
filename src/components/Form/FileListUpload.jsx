import { Upload, message, Button } from "antd";
import { UploadOutlined, PaperClipOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

/**
 * FileListUpload Component - Reusable multiple files upload component
 * @param {string} title - Label for the upload field
 * @param {array} value - Current file list (array of file objects with url/name)
 * @param {function} onChange - Callback function when files change (fileList)
 * @param {number} maxSize - Maximum file size per file in MB (default: 10)
 * @param {number} maxCount - Maximum number of files (default: 10)
 * @param {boolean} required - Is field required (default: false)
 * @param {boolean} disabled - Disable upload (default: false)
 */
const FileListUpload = ({
  title = "Danh sách file",
  value = [],
  onChange,
  maxSize = 10,
  maxCount = 10,
  required = false,
  disabled = false,
}) => {
  const [fileList, setFileList] = useState([]);

  // Update state when value prop changes
  useEffect(() => {
    if (value && Array.isArray(value)) {
      const initialFiles = value.map((file, index) => ({
        uid: file.uid || `${index}-${Date.now()}`,
        name: file.name || `file-${index + 1}`,
        status: "done",
        url: file.url || null,
        originFileObj: file.originFileObj || null,
      }));
      setFileList(initialFiles);
    } else {
      setFileList([]);
    }
  }, [value]);

  // Validate file before upload
  const beforeUpload = (file) => {
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`File phải nhỏ hơn ${maxSize}MB!`);
      return Upload.LIST_IGNORE;
    }

    const currentCount = fileList.length;
    if (currentCount >= maxCount) {
      message.error(`Chỉ được upload tối đa ${maxCount} file!`);
      return Upload.LIST_IGNORE;
    }

    return false; // Prevent auto upload, handle manually
  };

  // Handle file change
  const handleFileChange = ({ fileList: newFileList }) => {
    // Limit the number of files
    const limitedFileList = newFileList.slice(0, maxCount);
    setFileList(limitedFileList);

    // Extract file objects with URL for new files
    const processedFiles = limitedFileList.map((file) => {
      if (file.originFileObj && !file.url) {
        // New file - create object URL
        return {
          uid: file.uid,
          name: file.name,
          url: URL.createObjectURL(file.originFileObj),
          originFileObj: file.originFileObj,
          status: file.status,
        };
      }
      return file;
    });

    setFileList(processedFiles);

    // Call onChange with processed file list
    if (onChange) {
      onChange(processedFiles);
    }
  };

  // Remove file
  const handleRemoveFile = (file) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);

    if (onChange) {
      onChange(newFileList);
    }
  };

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

      <Upload
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleFileChange}
        onRemove={handleRemoveFile}
        multiple
        disabled={disabled}
        maxCount={maxCount}
      >
        <Button
          icon={<UploadOutlined />}
          disabled={disabled || fileList.length >= maxCount}
        >
          {fileList.length >= maxCount
            ? `Đã đạt giới hạn ${maxCount} file`
            : "Chọn file đính kèm"}
        </Button>
      </Upload>

      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginTop: "8px",
        }}
      >
        * Được tải lên tối đa {maxCount} file. Kích thước mỗi file tối đa:{" "}
        {maxSize}MB
      </div>

      {/* File list display */}
      {fileList.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontWeight: "500", marginBottom: "8px" }}>
            <PaperClipOutlined style={{ marginRight: "8px" }} />
            Danh sách file đã chọn ({fileList.length}/{maxCount})
          </div>
          {fileList.map((file, index) => (
            <div
              key={file.uid}
              style={{
                padding: "8px",
                background: "white",
                marginBottom: "4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                {index + 1}. {file.name}
              </span>
              <span style={{ fontSize: "12px", color: "#888" }}>
                {file.originFileObj
                  ? `${(file.originFileObj.size / 1024 / 1024).toFixed(2)} MB`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileListUpload;
