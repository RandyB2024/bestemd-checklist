import { onRequestGet as __api_tasks__id__comments_ts_onRequestGet } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks\\[id]\\comments.ts"
import { onRequestPost as __api_tasks__id__comments_ts_onRequestPost } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks\\[id]\\comments.ts"
import { onRequestDelete as __api_tasks__id__ts_onRequestDelete } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks\\[id].ts"
import { onRequestPatch as __api_tasks__id__ts_onRequestPatch } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks\\[id].ts"
import { onRequestPost as __api_login_ts_onRequestPost } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\login.ts"
import { onRequestPost as __api_logout_ts_onRequestPost } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\logout.ts"
import { onRequestGet as __api_me_ts_onRequestGet } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\me.ts"
import { onRequestGet as __api_tasks_ts_onRequestGet } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks.ts"
import { onRequestPost as __api_tasks_ts_onRequestPost } from "C:\\Users\\Randy\\Documents\\bestemd-checklist\\functions\\api\\tasks.ts"

export const routes = [
    {
      routePath: "/api/tasks/:id/comments",
      mountPath: "/api/tasks/:id",
      method: "GET",
      middlewares: [],
      modules: [__api_tasks__id__comments_ts_onRequestGet],
    },
  {
      routePath: "/api/tasks/:id/comments",
      mountPath: "/api/tasks/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_tasks__id__comments_ts_onRequestPost],
    },
  {
      routePath: "/api/tasks/:id",
      mountPath: "/api/tasks",
      method: "DELETE",
      middlewares: [],
      modules: [__api_tasks__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/tasks/:id",
      mountPath: "/api/tasks",
      method: "PATCH",
      middlewares: [],
      modules: [__api_tasks__id__ts_onRequestPatch],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_ts_onRequestPost],
    },
  {
      routePath: "/api/logout",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/me",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_me_ts_onRequestGet],
    },
  {
      routePath: "/api/tasks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_tasks_ts_onRequestGet],
    },
  {
      routePath: "/api/tasks",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_tasks_ts_onRequestPost],
    },
  ]