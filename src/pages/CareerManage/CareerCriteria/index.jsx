import { Flex, Image, Space, Tag } from "antd";
import { ContentWrapper } from "../../../assets/styles/contentWrapper.style";
import { PageBodyWrapper } from "../../../assets/styles/pageBodyWrapper.style";
import CustomBreadcrumb from "../../../components/breadcrumb";
import { useStore } from "./useStore";
import { useStore as useCareerStore } from "../Career/useStore";
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
import { useParams, useNavigate } from "react-router-dom";
import { formatDate } from "../../../utils/time";
const pageHeader = {
  breadcrumb: [
    {
      title: "Trang chủ",
      href: "/",
    },
    {
      title: "Quản lý nghề nghiệp",
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
    title: "Tên tiêu chí",
    dataIndex: "name",
    key: "name",
    width: "50%",
  },
  {
    title: "Thời gian tạo",
    dataIndex: "created_at",
    key: "created_at",
    align: "center",
    render: (_, record) => formatDate(record?.created_at),
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

const CareerCriteria = () => {
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

  const { selectedRecord: selectedCareer, getRecordById: getCareerById } =
    useCareerStore();

  const params = useParams();
  const { careerId } = params;
  const navigate = useNavigate();

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

  const handleViewDetail = (record) => {
    navigate(`/career-manage/careers/${careerId}/criteria/${record.id}`);
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
            name="Chi tiết"
            onClick={() => handleViewDetail(record)}
          />
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
          <UpdateButton onClick={() => handleModal(record)} />
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

  useEffect(() => {
    if (careerId) {
      getCareerById(careerId);
      updateFilters({ ...filters, career_id: careerId });
    }
  }, [careerId]);

  return (
    <ContentWrapper>
      <CustomBreadcrumb
        items={[
          ...pageHeader.breadcrumb,
          { title: "Danh sách nghề nghiệp", href: "/career-manage/careers" },
          selectedCareer && { title: selectedCareer?.name },
          { title: "Danh sách tiêu chí" },
        ]}
      />
      <PageBodyWrapper>
        {selectedCareer && (
          <Flex align="center" gap="16px">
            {selectedCareer?.background_image_url && (
              <Image
                src={selectedCareer?.background_image_url}
                alt="Career Background"
                width={160}
                height={120}
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <Flex vertical gap="8px">
              <h2 style={{ margin: 0 }}>{selectedCareer?.name}</h2>
              <p style={{ margin: 0 }}>{selectedCareer?.description}</p>
            </Flex>
          </Flex>
        )}
      </PageBodyWrapper>
      <PageBodyWrapper>
        <Flex
          align="center"
          justify="space-between"
          gap="10px"
          style={{ marginBottom: 10 }}
        >
          <Flex align="center" gap="10px" style={{ width: 200 }}>
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
        <ModalItem selectedCareer={selectedCareer} />
      </PageBodyWrapper>
    </ContentWrapper>
  );
};

export default CareerCriteria;
