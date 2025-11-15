import { useState } from "react";
import { PlayCircleOutlined } from "@ant-design/icons";
import { Image, Spin } from "antd";

/**
 * VideoWithThumb Component - Video player with thumbnail preview
 * Displays thumbnail first, loads video only when user clicks to play
 * @param {string} thumbnailUrl - URL of the thumbnail image
 * @param {string} videoUrl - URL of the video file
 * @param {string} alt - Alt text for thumbnail (default: "Video thumbnail")
 * @param {object} style - Custom styles for the container
 * @param {number} maxWidth - Maximum width of the video player (default: 600)
 */
const VideoWithThumb = ({
  thumbnailUrl,
  videoUrl,
  alt = "Video thumbnail",
  style = {},
  maxWidth = 600,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayClick = () => {
    if (!videoUrl) return;
    setIsLoading(true);
    setIsPlaying(true);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // If no thumbnail and no video, show nothing
  if (!thumbnailUrl && !videoUrl) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        maxWidth: `${maxWidth}px`,
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
        ...style,
      }}
    >
      {!isPlaying ? (
        // Thumbnail view
        <div
          style={{
            position: "relative",
            cursor: videoUrl ? "pointer" : "default",
            width: "100%",
          }}
          onClick={handlePlayClick}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={alt}
              preview={!videoUrl} // Allow preview only if no video
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "8px",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "300px",
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
              }}
            >
              <PlayCircleOutlined
                style={{ fontSize: "64px", color: "#bfbfbf" }}
              />
            </div>
          )}

          {/* Play button overlay */}
          {videoUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.3)",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <PlayCircleOutlined
                  style={{
                    fontSize: "48px",
                    color: "#889db1ff",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        // Video view
        <div style={{ position: "relative", width: "100%" }}>
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.7)",
                zIndex: 1,
                borderRadius: "8px",
              }}
            >
              <Spin size="large" tip="Đang tải video..." />
            </div>
          )}
          <video
            src={videoUrl}
            controls
            autoPlay
            onLoadedData={handleVideoLoad}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
            }}
          >
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoWithThumb;
