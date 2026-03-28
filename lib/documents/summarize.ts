/**
 * AI Document Summarizer — Multi-AI Edition
 *
 * Delegates to the multi-AI document analysis engine.
 * Maintains backward-compatible function signature.
 * Never throws — aiSummary stays null on failure.
 */

import { analyzeDocument } from "./analyze-document";

export async function summarizeDocument(
  documentId: string,
  fileUrl: string,
  fileType: string,
  docType: string
): Promise<void> {
  // Delegate to multi-AI analysis engine
  return analyzeDocument(documentId, fileUrl, fileType, docType);
}
