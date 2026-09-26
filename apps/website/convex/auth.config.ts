export default {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ??
        process.env.CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
}
