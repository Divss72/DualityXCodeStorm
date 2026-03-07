import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Read backend.txt from project root
        const filePath = path.join(process.cwd(), 'backend.txt');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'backend.txt not found' }, { status: 404 });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading backend.txt:', error);
        return NextResponse.json({ error: 'Failed to read perception data' }, { status: 500 });
    }
}
