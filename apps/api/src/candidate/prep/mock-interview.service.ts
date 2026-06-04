import { Injectable, Logger } from "@nestjs/common";
import type { MockInterviewStart, MockInterviewTurn } from "@trajct/contracts";

/**
 * F-008 — Mock interviews (text/voice/video).
 * Streaming turns via SSE for text mode; WebRTC signalling for voice/video.
 * Cost: frontier tier per turn. Cap checked before each turn.
 */
@Injectable()
export class MockInterviewService {
  private readonly logger = new Logger(MockInterviewService.name);

  async startSession(req: MockInterviewStart, userId: string): Promise<{ sessionId: string }> {
    this.logger.log(`Mock interview start: company=${req.companyId} mode=${req.mode} user=${userId}`);
    // TODO V1: Create mock_interviews row, return sessionId
    throw new Error("F-008 not implemented — V1");
  }

  async processTurn(turn: MockInterviewTurn, userId: string): Promise<{ response: string; isComplete: boolean }> {
    void userId;
    // TODO V1: Cap check → AI generate turn response → stream back
    throw new Error("F-008 not implemented — V1");
  }

  async endSession(sessionId: string, userId: string): Promise<{ feedback: object }> {
    void userId;
    void sessionId;
    throw new Error("Not implemented");
  }
}
