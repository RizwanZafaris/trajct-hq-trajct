import { Injectable, Logger } from "@nestjs/common";
import type { OfferEvalRequest } from "@trajct/contracts";

/**
 * F-022 — Offer evaluation.
 * Frontier tier AI: evaluates total comp, equity, benefits vs market.
 * Suggests negotiation angles grounded in market benchmark.
 */
@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  async evaluateOffer(req: OfferEvalRequest, userId: string): Promise<{
    evaluationId: string;
    score: number;
    pros: string[];
    cons: string[];
    negotiationAngles: string[];
    counterOfferSuggestion: object;
    marketBenchmark: object;
  }> {
    this.logger.log(`Offer eval: ${req.roleTitle} at ${req.companyName} (${req.baseSalaryUsd} USD)`);
    void userId;
    throw new Error("F-022 not implemented — V1");
  }

  async listOfferEvals(userId: string): Promise<unknown[]> {
    void userId;
    return [];
  }
}
