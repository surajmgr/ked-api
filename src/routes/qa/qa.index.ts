import { createRouter } from '@/lib/utils/init';
import * as routes from './qa.route';
import * as handlers from './qa.handler';

const qa = createRouter()
  .openapi(routes.askQuestion, handlers.askQuestion)
  .openapi(routes.answerQuestion, handlers.answerQuestion)
  .openapi(routes.vote, handlers.vote)
  .openapi(routes.acceptAnswer, handlers.acceptAnswer)
  .openapi(routes.listQuestions, handlers.listQuestions)
  .openapi(routes.getQuestion, handlers.getQuestion)
  .openapi(routes.getQuestionBySlug, handlers.getQuestionBySlug);

export default qa;
