import { handleInquiry } from "../../server/inquiry.js";

export const onRequest: PagesFunction<Env> = (context) =>
  handleInquiry(context.request, context.env.SLACK_WEBHOOK_URL);
