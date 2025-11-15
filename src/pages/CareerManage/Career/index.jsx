import { Flex, Image, Space, Tag } from "antd";
import { ContentWrapper } from "../../../assets/styles/contentWrapper.style";
import { PageBodyWrapper } from "../../../assets/styles/pageBodyWrapper.style";
import CustomBreadcrumb from "../../../components/breadcrumb";
import { useStore } from "./useStore";
import {
  CreateButton,
  DeleteButton,
  DetailButton,
  UpdateButton,
} from "../../../components/Button";
import { useEffect } from "react";
import CustomTable from "../../../components/Table";
import TextInput from "../../../components/Form/TextInput";
import SelectInput from "../../../components/Form/SelectInput";
import ModalItem from "./modal";
import { ACTION_NAME } from "../../../utils/common";
import { FaLock, FaLockOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const pageHeader = {
  breadcrumb: [
    {
      title: "Trang chủ",
      href: "/",
    },
    {
      title: "Quản lý nghề nghiệp",
    },
    {
      title: "Danh sách nghề nghiệp",
    },
  ],
};
const baseColumns = [
  {
    title: "STT",
    dataIndex: "index",
    key: "index",
    align: "center",
    width: 50,
  },
  {
    title: "Ảnh đại diện",
    dataIndex: "avatar_url",
    key: "avatar_url",
    align: "center",
    width: 100,
    render: (_, record) => (
      <Image
        src={record?.background_image_url}
        alt="Avatar"
        style={{ width: 80, height: 60 }}
      />
    ),
  },
  {
    title: "Tên nghề nghiệp",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Tags",
    dataIndex: "tags",
    key: "tags",
  },
  {
    title: "Người tạo",
    dataIndex: "created_by",
    key: "created_by",
    align: "center",
    render: (_, record) => record?.created_by_admin_info?.full_name,
  },
  {
    title: "Trạng thái",
    dataIndex: "is_active",
    key: "is_active",
    align: "center",
    width: 140,
    render: (_, record) => (
      <Tag color={record?.is_active ? "green" : "red"}>
        {record?.is_active ? "Hoạt động" : "Không hoạt động"}
      </Tag>
    ),
  },
];

const Careers = () => {
  const navigate = useNavigate();
  const {
    records,
    isLoading,
    limit,
    page,
    total,
    toggleModal,
    getRecords,
    handleRecord,
    filters,
    updateFilters,
  } = useStore();

  const onChangeTable = (pagination, tableFilters, sorter) => {
    const { current, pageSize } = pagination;
    getRecords({
      limit: pageSize,
      page: current,
      filters,
    });
  };

  const onChangeFilter = (property, value) => {
    updateFilters({ ...filters, [property]: value });
  };

  const handleModal = (item) => {
    toggleModal(item);
  };

  const columns = [
    ...baseColumns,
    {
      title: "Công cụ",
      key: "tool",
      align: "center",
      width: 140,
      render: (text, record) => (
        <Space>
          <DetailButton
            name="Tiêu chí"
            onClick={() => {
              navigate(`${record?.id}`);
            }}
          />
          <UpdateButton onClick={() => handleModal(record)} />{" "}
          <UpdateButton
            icon={record?.is_active ? <FaLock /> : <FaLockOpen />}
            className={record?.is_active ? "red-button" : "green-button"}
            title={record?.is_active ? "Khóa" : "Mở khóa"}
            onClick={() => {
              handleRecord({
                item: { id: record.id },
                actionName: ACTION_NAME.ACTIVE,
                filters,
                limit,
                page:
                  record?.index === limit * (page - 1) + 1
                    ? Math.max(page - 1, 1)
                    : page,
              });
            }}
          />
          <DeleteButton
            onConfirm={() => {
              handleRecord({
                item: record,
                actionName: ACTION_NAME.DELETE,
                filters,
                limit,
                page:
                  record?.index === limit * (page - 1) + 1
                    ? Math.max(page - 1, 1)
                    : page,
              });
            }}
          />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    getRecords({ limit, page, filters });
  }, [filters]);

  return (
    <ContentWrapper>
      <CustomBreadcrumb items={pageHeader.breadcrumb} />
      <PageBodyWrapper>
        <Flex
          align="center"
          justify="space-between"
          gap="10px"
          style={{ marginBottom: 10 }}
        >
          <Flex align="center" gap="10px" style={{ width: 400 }}>
            <TextInput
              value={filters?.search}
              onChange={onChangeFilter}
              property={"search"}
              placeholder="Tên nghề nghiệp"
            />
            <SelectInput
              value={filters?.is_active}
              property={"is_active"}
              onChange={onChangeFilter}
              options={[
                {
                  value: null,
                  label: "Tất cả",
                },
                {
                  value: true,
                  label: "Hoạt động",
                },
                {
                  value: false,
                  label: "Không hoạt động",
                },
              ]}
            />
          </Flex>
          <CreateButton onClick={() => handleModal(null)} />
        </Flex>
        <CustomTable
          columns={columns}
          data={records}
          loading={isLoading}
          onChange={onChangeTable}
          pagination={{
            current: page,
            pageSize: limit,
            total,
          }}
        />
        <ModalItem />
      </PageBodyWrapper>
    </ContentWrapper>
  );
};

export default Careers;
