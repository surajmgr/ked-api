import { createRouter } from '@/lib/utils/init';
import * as routes from './content.route';
import * as handlers from './content.handler';

const content = createRouter()
  .openapi(routes.listBooks, handlers.listBooks)
  .openapi(routes.listTopics, handlers.listTopics)
  .openapi(routes.listSubtopics, handlers.listSubtopics)
  .openapi(routes.listNotesByTopicSlug, handlers.listNotesByTopicSlug)
  .openapi(routes.listNotesBySubtopicSlug, handlers.listNotesBySubtopicSlug)
  .openapi(routes.createBook, handlers.createBook)
  .openapi(routes.createTopic, handlers.createTopic)
  .openapi(routes.createSubtopic, handlers.createSubtopic)
  .openapi(routes.createBulkTopics, handlers.createBulkTopics)
  .openapi(routes.createBulkSubtopics, handlers.createBulkSubtopics)
  .openapi(routes.createNote, handlers.createNote)
  .openapi(routes.getNote, handlers.getNote)
  .openapi(routes.getNoteBySlug, handlers.getNoteBySlug)
  .openapi(routes.getNotePreview, handlers.getNotePreview)
  .openapi(routes.deleteNote, handlers.deleteNote)
  .openapi(routes.getSimilarContent, handlers.getSimilarContent)
  .openapi(routes.saveNoteDraft, handlers.saveNoteDraft)
  .openapi(routes.publishContent, handlers.publishContent)
  .openapi(routes.getContributionDashboard, handlers.getContributionDashboard);

export default content;
