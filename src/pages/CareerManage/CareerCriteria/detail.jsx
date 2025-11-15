import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Spin,
  Descriptions,
  Image,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  List,
  Empty,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { ContentWrapper } from "../../../assets/styles/contentWrapper.style";
import { PageBodyWrapper } from "../../../assets/styles/pageBodyWrapper.style";
import CustomBreadcrumb from "../../../components/breadcrumb";
import VideoWithThumb from "../../../components/VideoWithThumb";
import * as careerApi from "../../../apis/CareerManage/career.api";
import * as criteriaApi from "../../../apis/CareerManage/criteria.api";

const { Title, Paragraph } = Typography;

const DetailCareerCriteria = () => {
  const { careerId, criteriaId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [career, setCareer] = useState(null);
  const [criteria, setCriteria] = useState(null);

  // Fetch career and criteria details
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch career details
        const careerResponse = await careerApi.getById(careerId);
        if (careerResponse.status === 200 || careerResponse.status === 201) {
          setCareer(careerResponse.data.data);
        }

        // Fetch criteria details
        const criteriaResponse = await criteriaApi.getById({ id: criteriaId });
        if (
          criteriaResponse.status === 200 ||
          criteriaResponse.status === 201
        ) {
          setCriteria(criteriaResponse.data.data);
        }
      } catch (error) {
        message.error("Không thể tải thông tin chi tiết");
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (careerId && criteriaId) {
      fetchData();
    }
  }, [careerId, criteriaId]);

  // Breadcrumb items
  const breadcrumbItems = [
    {
      title: "Trang chủ",
      href: "/",
    },
    {
      title: "Quản lý nghề nghiệp",
    },
    {
      title: "Danh sách nghề nghiệp",
      href: "/career-manage/careers",
    },
    {
      title: career?.name || "Nghề nghiệp",
      href: `/career-manage/careers/${careerId}`,
    },
    {
      title: criteria?.name || "Chi tiết tiêu chí",
    },
  ];

  const handleEdit = () => {
    // Navigate to edit page or open modal
    navigate(`/career-manage/careers/${careerId}/criteria/${criteriaId}/edit`);
  };

  const handleBack = () => {
    navigate(`/career-manage/careers/${careerId}`);
  };

  if (loading) {
    return (
      <PageBodyWrapper>
        <ContentWrapper>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        </ContentWrapper>
      </PageBodyWrapper>
    );
  }

  if (!career || !criteria) {
    return (
      <PageBodyWrapper>
        <ContentWrapper>
          <CustomBreadcrumb items={breadcrumbItems} />
          <Divider />
          <Empty description="Không tìm thấy thông tin" />
        </ContentWrapper>
      </PageBodyWrapper>
    );
  }

  return (
    <ContentWrapper>
      <CustomBreadcrumb items={breadcrumbItems} />
      <PageBodyWrapper>
        {/* Criteria Details Card */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Chi tiết tiêu chí: {criteria.name}
            </Title>
          }
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên tiêu chí">
              <strong>{criteria.name}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Thứ tự hiển thị">
              {criteria.order_index || "Chưa xác định"}
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={criteria.is_active ? "green" : "red"}>
                {criteria.is_active ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Mô tả">
              {criteria.description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: criteria.description }}
                  style={{
                    padding: "12px",
                    background: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                <span style={{ color: "#999" }}>Chưa có mô tả</span>
              )}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Video tiêu chí</Divider>
          {criteria.video_thumbnail_url || criteria.video_url ? (
            <VideoWithThumb
              thumbnailUrl={criteria.video_thumbnail_url}
              videoUrl={criteria.video_url}
              alt={`Video thumbnail - ${criteria.name}`}
              maxWidth={700}
            />
          ) : (
            <Empty
              description="Chưa có video và thumbnail"
              image={<PlayCircleOutlined style={{ fontSize: 64 }} />}
            />
          )}

          <Divider orientation="left">File đính kèm</Divider>
          {criteria.attachments && criteria.attachments.length > 0 ? (
            <List
              dataSource={criteria.attachments}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <FileOutlined style={{ fontSize: "18px" }} />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name || `File ${index + 1}`}
                    </a>
                  </Space>
                </List.Item>
              )}
              bordered
              style={{ background: "white" }}
            />
          ) : (
            <Empty description="Chưa có file đính kèm" />
          )}
        </Card>
      </PageBodyWrapper>
    </ContentWrapper>
  );
};

export default DetailCareerCriteria;
