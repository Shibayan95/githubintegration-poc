import { IconLayoutDashboard, type Icon } from "@tabler/icons-react";

export * from "./app-layout";
export * from "./app-sidebar";
export * from "./app-header";

type Route = {
  title: string;
  url: string;
  icon: Icon;
};

export const routes: Route[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconLayoutDashboard,
  },
];
