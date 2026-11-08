import { NextResponse } from 'next/server';
import { POST as adminPOST, GET as adminGET } from '../admin-webhook/route';

export const POST = adminPOST;
export const GET = adminGET;
