const routes = [
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "*",
    component: () => import("pages/Error404.vue")
  },
  {
    path: "/",
    component: () => import("pages/savebank.vue")
  }
];

export default routes;
