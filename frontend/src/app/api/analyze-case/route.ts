import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null

export interface AnalysisRequest {
  caseId: string
  disputeType: string
  description: string
  institutionName: string
  department?: string
  matricNumber?: string
  evidenceCount?: number
}

export interface AnalysisResult {
  summary: string
  strengthAssessment: 'STRONG' | 'MODERATE' | 'WEAK'
  keyIssues: string[]
  recommendedOutcome: 'UPHELD' | 'REJECTED' | 'FURTHER_REVIEW'
  reasoning: string
  suggestedActions: string[]
  confidenceScore: number
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalysisRequest

    if (!body.caseId || !body.description || !body.disputeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!client) {
      // Return a structured placeholder when no API key is set
      return NextResponse.json({
        summary: 'AI analysis unavailable — ANTHROPIC_API_KEY not configured.',
        strengthAssessment: 'MODERATE',
        keyIssues: ['API key not configured'],
        recommendedOutcome: 'FURTHER_REVIEW',
        reasoning: 'Configure ANTHROPIC_API_KEY to enable AI case analysis.',
        suggestedActions: ['Configure the ANTHROPIC_API_KEY environment variable in Vercel.'],
        confidenceScore: 0,
      } satisfies AnalysisResult)
    }

    const formatType = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    const prompt = `You are a neutral academic dispute arbitrator for the Campus Justice Protocol (CJP), a decentralized AI-powered system for resolving university disputes.

Analyze the following academic dispute case and provide a structured preliminary assessment.

**Case ID:** ${body.caseId}
**Dispute Type:** ${formatType(body.disputeType)}
**Institution:** ${body.institutionName || 'Unknown Institution'}
**Department:** ${body.department || 'Not specified'}
**Student ID / Matric:** ${body.matricNumber || 'Not specified'}
**Evidence Files Submitted:** ${body.evidenceCount ?? 0} file(s)

**Student's Complaint:**
${body.description}

---

Provide your analysis in the following JSON format exactly:
{
  "summary": "<2-3 sentence neutral summary of what the student is alleging>",
  "strengthAssessment": "<STRONG | MODERATE | WEAK>",
  "keyIssues": ["<issue 1>", "<issue 2>", "<issue 3>"],
  "recommendedOutcome": "<UPHELD | REJECTED | FURTHER_REVIEW>",
  "reasoning": "<3-4 sentences explaining your reasoning based on the complaint and dispute type>",
  "suggestedActions": ["<action 1>", "<action 2>"],
  "confidenceScore": <0.0 to 1.0>
}

Base your analysis purely on the information provided. Be fair and neutral. If the description is too vague or evidence is lacking, recommend FURTHER_REVIEW.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Model did not return valid JSON')
    }

    const analysis = JSON.parse(jsonMatch[0]) as AnalysisResult
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[analyze-case]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
