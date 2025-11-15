import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import MainLayout from "../layouts";
import Login from "../pages/Auth/index.jsx";
import TestPage from "../pages/TestPage.jsx";
import NotFound from "../pages/NotFound/index.jsx";
import Users from "../pages/SystemAdmin/Users/index.jsx";
import RefreshToken from "../pages/SystemAdmin/RefreshToken/index.jsx";
import Careers from "../pages/CareerManage/Career/index.jsx";
import CareerCriteria from "../pages/CareerManage/CareerCriteria/index.jsx";
import DetailCareerCriteria from "../pages/CareerManage/CareerCriteria/detail.jsx";

export const router = createBrowserRouter([
  {
    path: "dang-nhap",
    element: <Login />,
  },
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "system-admin",
        children: [
          {
            path: "users",
            element: <Users />,
          },
          {
            path: "refresh-tokens",
            element: <RefreshToken />,
          },
        ],
      },
      {
        path: "test",
        element: <TestPage />,
      },
      {
        path: "career-manage",
        children: [
          {
            path: "careers",
            element: <Careers />,
          },
          {
            path: "careers/:careerId",
            element: <CareerCriteria />,
          },
          {
            path: "careers/:careerId/criteria/:criteriaId",
            element: <DetailCareerCriteria />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
