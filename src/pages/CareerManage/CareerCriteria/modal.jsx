import { useStore } from "./useStore";
import CustomModal from "../../../components/Form/modal";
import { ACTION_NAME } from "../../../utils/common";
import TextInput from "../../../components/Form/TextInput";
import RichTextEditor from "../../../components/Form/RichTextEditor";
import NumberInput from "../../../components/Form/NumberInput";
import ImageUpload from "../../../components/Form/ImageUpload";
import VideoUpload from "../../../components/Form/VideoUpload";
import FileListUpload from "../../../components/Form/FileListUpload";
import { useState, useEffect } from "react";
import { Checkbox } from "antd";

const ModalItem = ({ selectedCareer }) => {
  const {
    modalActive,
    selectedRecord,
    toggleModal,
    handleRecord,
    limit,
    page,
    updateSelectedRecordInput,
    filters,
    isLoading,
  } = useStore();

  // Local state for video thumbnail
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  // Local state for video
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  // Local state for attachments
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // Clear all file states when modal opens/closes
  useEffect(() => {
    if (modalActive) {
      // Load existing data when editing
      setThumbnailUrl(selectedRecord?.video_thumbnail || null);
      setThumbnailFile(null);
      setVideoUrl(selectedRecord?.video || null);
      setVideoFile(null);
      setAttachmentFiles(selectedRecord?.attachments || []);
    } else {
      // Clear all states when modal closes
      setThumbnailUrl(null);
      setThumbnailFile(null);
      setVideoUrl(null);
      setVideoFile(null);
      setAttachmentFiles([]);
    }
  }, [modalActive, selectedRecord?.id]);

  const handleModal = (_item) => {
    toggleModal(_item);
  };

  const onRecordInputChange = (key, event) => {
    if (key) {
      let clone = Object.assign({}, selectedRecord);
      clone[key] = event;
      updateSelectedRecordInput(clone);
    }
  };

  const handleThumbnailChange = (url, file) => {
    setThumbnailUrl(url);
    setThumbnailFile(file);
  };

  const handleVideoChange = (url, file) => {
    setVideoUrl(url);
    setVideoFile(file);
  };

  const handleAttachmentsChange = (fileList) => {
    setAttachmentFiles(fileList);
  };

  const handleData = (_actionName, _item) => {
    handleRecord({
      item: {
        ..._item,
        video_thumbnail_url: thumbnailUrl,
        video_thumbnail_file: thumbnailFile,
        video_url: videoUrl,
        video_file: videoFile,
        attachments: attachmentFiles,
        career_id: selectedCareer?.id,
      },
      filters,
      actionName: _actionName,
      limit,
      page,
    });
  };

  return (
    <CustomModal
      open={modalActive}
      onCancel={() => handleModal(null)}
      onOk={
        selectedRecord?.id
          ? () => handleData(ACTION_NAME.UPDATE, selectedRecord)
          : () => handleData(ACTION_NAME.CREATE, selectedRecord)
      }
      title={
        selectedRecord?.id
          ? "Cập nhật tiêu chí nghề nghiệp"
          : "Thêm mới tiêu chí nghề nghiệp"
      }
      okText="Chấp nhận"
      cancelText="Từ chối"
      width={800}
      confirmLoading={isLoading}
    >
      <TextInput
        title="Tên tiêu chí"
        value={selectedRecord?.name}
        onChange={onRecordInputChange}
        property={"name"}
        required
      />

      <RichTextEditor
        title="Mô tả tiêu chí"
        value={selectedRecord?.description}
        onChange={onRecordInputChange}
        property={"description"}
        placeholder="Nhập mô tả chi tiết cho tiêu chí..."
      />

      <NumberInput
        title="Thứ tự hiển thị"
        value={selectedRecord?.order_index}
        onChange={onRecordInputChange}
        property={"order_index"}
      />

      <div style={{ marginTop: "16px" }}>
        <Checkbox
          checked={selectedRecord?.is_active !== false}
          onChange={(e) => onRecordInputChange("is_active", e.target.checked)}
        >
          Trạng thái hoạt động
        </Checkbox>
      </div>

      <ImageUpload
        title="Ảnh thumbnail của video"
        value={thumbnailUrl}
        onChange={handleThumbnailChange}
        maxSize={5}
      />

      <VideoUpload
        title="Video của tiêu chí"
        value={videoUrl}
        onChange={handleVideoChange}
        maxSize={100}
      />

      <FileListUpload
        title="Danh sách file đính kèm"
        value={attachmentFiles}
        onChange={handleAttachmentsChange}
        maxSize={10}
        maxCount={10}
      />
    </CustomModal>
  );
};

export default ModalItem;
