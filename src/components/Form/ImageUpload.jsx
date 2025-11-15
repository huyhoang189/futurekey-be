import { Upload, message, Image } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

/**
 * ImageUpload Component - Reusable single image upload component
 * @param {string} title - Label for the upload field
 * @param {string} value - Current image URL (can be base64 or remote URL)
 * @param {function} onChange - Callback function when image changes (url, file)
 * @param {number} maxSize - Maximum file size in MB (default: 5)
 * @param {boolean} required - Is field required (default: false)
 * @param {boolean} disabled - Disable upload (default: false)
 */
const ImageUpload = ({
  title = "Hình ảnh",
  value = null,
  onChange,
  maxSize = 5,
  required = false,
  disabled = false,
}) => {
  const [fileList, setFileList] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      setImageUrl(value);
      setFileList([
        {
          uid: "-1",
          name: "image.png",
          status: "done",
          url: value,
        },
      ]);
    } else {
      setFileList([]);
      setImageUrl(null);
    }
  }, [value]);

  // Validate file before upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ được upload file ảnh!");
      return Upload.LIST_IGNORE;
    }

    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`Ảnh phải nhỏ hơn ${maxSize}MB!`);
      return Upload.LIST_IGNORE;
    }

    return false; // Prevent auto upload, handle manually
  };

  // Handle file change
  const handleImageChange = ({ fileList: newFileList, file }) => {
    // Only keep the last file (single image)
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);

    if (latestFile.length > 0 && file.status !== "removed") {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImageUrl(base64);

        // Call onChange with url and file
        if (onChange) {
          onChange(base64, file.originFileObj || file);
        }
      };
      reader.readAsDataURL(file.originFileObj || file);
    } else if (latestFile.length === 0) {
      // Image removed
      setImageUrl(null);
      if (onChange) {
        onChange(null, null);
      }
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setFileList([]);
    setImageUrl(null);
    if (onChange) {
      onChange(null, null);
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
        listType="picture-card"
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleImageChange}
        onRemove={handleRemoveImage}
        maxCount={1}
        accept="image/*"
        disabled={disabled}
      >
        {fileList.length === 0 && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>

      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginTop: "8px",
        }}
      >
        * Chỉ được tải lên 1 ảnh, định dạng: JPG, PNG, GIF. Kích thước tối đa:{" "}
        {maxSize}MB
      </div>
    </div>
  );
};

export default ImageUpload;
