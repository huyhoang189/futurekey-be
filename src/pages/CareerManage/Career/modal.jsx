import { useStore } from "./useStore";
import CustomModal from "../../../components/Form/modal";
import { ACTION_NAME } from "../../../utils/common";
import TextInput from "../../../components/Form/TextInput";
import TextAreaInput from "../../../components/Form/TextAreaInput";
import ImageUpload from "../../../components/Form/ImageUpload";
import { useState, useEffect } from "react";
import { Checkbox } from "antd";

const ModalItem = () => {
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

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Clear image state when modal opens/closes
  useEffect(() => {
    if (modalActive) {
      setImageUrl(selectedRecord?.image_url || null);
      setImageFile(null);
    } else {
      setImageUrl(null);
      setImageFile(null);
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

  const handleImageChange = (url, file) => {
    setImageUrl(url);
    setImageFile(file);
  };

  const handleData = (_actionName, _item) => {
    handleRecord({
      item: {
        ..._item,
        image_url: imageUrl,
        image_file: imageFile,
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
          ? "Cập nhật thông tin tin nghề"
          : "Thêm mới thông tin tin nghề"
      }
      okText="Chấp nhận"
      cancelText="Từ chối"
      width={800}
      confirmLoading={isLoading}
    >
      <TextInput
        title="Tên nghề nghiệp"
        value={selectedRecord?.name}
        onChange={onRecordInputChange}
        property={"name"}
      />
      <TextAreaInput
        title="Mô tả nghề nghiệp"
        value={selectedRecord?.description}
        onChange={onRecordInputChange}
        property={"description"}
        rows={4}
      />
      <TextInput
        title="Tags"
        value={selectedRecord?.tags}
        onChange={onRecordInputChange}
        property={"tags"}
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
        title="Hình ảnh nghề nghiệp"
        value={imageUrl}
        onChange={handleImageChange}
      />
    </CustomModal>
  );
};

export default ModalItem;
