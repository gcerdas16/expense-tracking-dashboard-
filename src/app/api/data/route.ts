import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const urls = {
        expenses: process.env.EXPENSES_CSV_URL,
        incomes: process.env.INCOMES_CSV_URL
    };

    const url = type === 'incomes' ? urls.incomes : urls.expenses;

    if (!url) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        const data = await response.text();
        return new NextResponse(data, {
            headers: { 'Content-Type': 'text/csv' }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}