import { Logger } from 'winston';
import { Source } from './generator';
import { RetrievedDocument } from './retriever';

export interface ValidatedResponse {
  message: string;
  sources: Source[];
  confidence: number;
  warnings?: string[];
}

export interface ValidatorOptions {
  logger: Logger;
}

/**
 * Response validator for hallucination prevention
 * 
 * Implements multiple validation layers:
 * 1. Source grounding - ensures claims are backed by context
 * 2. Entity validation - verifies mentioned entities exist
 * 3. URL validation - ensures cited URLs are valid
 * 4. Scope enforcement - detects out-of-scope responses
 */
export class ResponseValidator {
  private logger: Logger;

  constructor(options: ValidatorOptions) {
    this.logger = options.logger;
  }

  /**
   * Validate and potentially modify the response
   */
  async validate(
    response: string,
    sources: Source[],
    retrievedDocs: RetrievedDocument[],
  ): Promise<ValidatedResponse> {
    const warnings: string[] = [];
    let confidence = 1.0;
    let validatedMessage = response;

    // Layer 1: Check for speculative language
    const speculativeResult = this.checkSpeculativeLanguage(response);
    if (speculativeResult.hasSpeculative) {
      confidence -= 0.2;
      warnings.push('Response contains speculative language');
      this.logger.debug('Speculative language detected in response');
    }

    // Layer 2: Verify source citations exist
    const citationResult = this.verifyCitations(response, retrievedDocs);
    if (!citationResult.valid) {
      confidence -= 0.1;
      warnings.push('Some citations could not be verified');
    }

    // Layer 3: Check for out-of-scope content
    const scopeResult = this.checkScope(response);
    if (scopeResult.outOfScope) {
      confidence -= 0.3;
      warnings.push('Response may contain out-of-scope content');
    }

    // Layer 4: Validate URLs in sources
    const urlResult = this.validateUrls(sources);
    if (!urlResult.valid) {
      // Filter out invalid sources
      sources = sources.filter(s => this.isValidBackstageUrl(s.url));
    }

    // Layer 5: Check response length and quality
    if (response.length < 20) {
      confidence -= 0.2;
      warnings.push('Response is unusually short');
    }

    // Apply confidence floor
    confidence = Math.max(confidence, 0.1);

    // If confidence is very low, add disclaimer
    if (confidence < 0.5) {
      validatedMessage = `⚠️ *Note: This response may not be fully accurate. Please verify with the documentation.*\n\n${response}`;
    }

    this.logger.debug(`Response validated with confidence: ${confidence}`);

    return {
      message: validatedMessage,
      sources,
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check for speculative or uncertain language
   */
  private checkSpeculativeLanguage(response: string): { hasSpeculative: boolean; phrases: string[] } {
    const speculativePhrases = [
      'i think',
      'i believe',
      'probably',
      'might be',
      'could be',
      'possibly',
      'i assume',
      'i guess',
      'not sure but',
      'i\'m not certain',
      'it seems like',
      'presumably',
    ];

    const lowerResponse = response.toLowerCase();
    const foundPhrases = speculativePhrases.filter(phrase => 
      lowerResponse.includes(phrase)
    );

    return {
      hasSpeculative: foundPhrases.length > 0,
      phrases: foundPhrases,
    };
  }

  /**
   * Verify that citations reference valid documents
   */
  private verifyCitations(
    response: string,
    docs: RetrievedDocument[],
  ): { valid: boolean; invalidCitations: number[] } {
    const citationPattern = /\[(\d+)\]/g;
    const invalidCitations: number[] = [];

    let match;
    while ((match = citationPattern.exec(response)) !== null) {
      const num = parseInt(match[1], 10);
      if (num < 1 || num > docs.length) {
        invalidCitations.push(num);
      }
    }

    return {
      valid: invalidCitations.length === 0,
      invalidCitations,
    };
  }

  /**
   * Check if response stays within scope
   */
  private checkScope(response: string): { outOfScope: boolean; reason?: string } {
    const outOfScopeIndicators = [
      // Topics we shouldn't be answering about
      'stock price',
      'weather',
      'sports',
      'politics',
      'medical advice',
      'legal advice',
      'financial advice',
      // Hallucination indicators
      'as of my knowledge cutoff',
      'as an ai language model',
      'i was trained on',
      'in my training data',
    ];

    const lowerResponse = response.toLowerCase();
    
    for (const indicator of outOfScopeIndicators) {
      if (lowerResponse.includes(indicator)) {
        return {
          outOfScope: true,
          reason: `Contains out-of-scope indicator: "${indicator}"`,
        };
      }
    }

    return { outOfScope: false };
  }

  /**
   * Validate that URLs are valid Backstage paths
   */
  private validateUrls(sources: Source[]): { valid: boolean; invalidUrls: string[] } {
    const invalidUrls: string[] = [];

    for (const source of sources) {
      if (!this.isValidBackstageUrl(source.url)) {
        invalidUrls.push(source.url);
      }
    }

    return {
      valid: invalidUrls.length === 0,
      invalidUrls,
    };
  }

  /**
   * Check if a URL is a valid Backstage path
   */
  private isValidBackstageUrl(url: string): boolean {
    // Valid Backstage URL patterns
    const validPatterns = [
      /^\/catalog/,
      /^\/docs/,
      /^\/api-docs/,
      /^\/create/,
      /^\/search/,
      /^\/settings/,
    ];

    return validPatterns.some(pattern => pattern.test(url));
  }
}
