import { Upload, message } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

/**
 * VideoUpload Component - Reusable single video upload component
 * @param {string} title - Label for the upload field
 * @param {string} value - Current video URL
 * @param {function} onChange - Callback function when video changes (url, file)
 * @param {number} maxSize - Maximum file size in MB (default: 100)
 * @param {boolean} required - Is field required (default: false)
 * @param {boolean} disabled - Disable upload (default: false)
 */
const VideoUpload = ({
  title = "Video",
  value = null,
  onChange,
  maxSize = 100,
  required = false,
  disabled = false,
}) => {
  const [fileList, setFileList] = useState([]);

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      setFileList([
        {
          uid: "-1",
          name: "video.mp4",
          status: "done",
          url: value,
        },
      ]);
    } else {
      setFileList([]);
    }
  }, [value]);

  // Validate file before upload
  const beforeUpload = (file) => {
    const isVideo = file.type.startsWith("video/");
    if (!isVideo) {
      message.error("Chỉ được upload file video!");
      return Upload.LIST_IGNORE;
    }

    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`Video phải nhỏ hơn ${maxSize}MB!`);
      return Upload.LIST_IGNORE;
    }

    return false; // Prevent auto upload, handle manually
  };

  // Handle file change
  const handleVideoChange = ({ fileList: newFileList, file }) => {
    // Only keep the last file (single video)
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);

    if (latestFile.length > 0 && file.status !== "removed") {
      // Create object URL for preview
      const videoUrl = URL.createObjectURL(file.originFileObj || file);

      // Call onChange with url and file
      if (onChange) {
        onChange(videoUrl, file.originFileObj || file);
      }
    } else if (latestFile.length === 0) {
      // Video removed
      if (onChange) {
        onChange(null, null);
      }
    }
  };

  // Remove video
  const handleRemoveVideo = () => {
    setFileList([]);
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
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleVideoChange}
        onRemove={handleRemoveVideo}
        maxCount={1}
        accept="video/*"
        disabled={disabled}
      >
        {fileList.length === 0 && (
          <div
            style={{
              border: "1px dashed #d9d9d9",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1890ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d9d9d9";
            }}
          >
            <VideoCameraOutlined
              style={{ fontSize: "32px", color: "#1890ff" }}
            />
            <div style={{ marginTop: "8px" }}>Click để chọn video</div>
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
        * Chỉ được tải lên 1 video, định dạng: MP4, AVI, MOV, WMV, FLV, MKV.
        Kích thước tối đa: {maxSize}MB
      </div>

      {/* Video preview */}
      {fileList.length > 0 && fileList[0].url && (
        <div style={{ marginTop: "16px" }}>
          <video
            src={fileList[0].url}
            controls
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
