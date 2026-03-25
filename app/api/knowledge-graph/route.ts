import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subject_id');

        if (!subjectId) {
            return NextResponse.json({ error: 'Missing subject_id' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Node limits (Topics) for exactly this mapped Subject jurisdiction
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('id, name, description, importance')
            .eq('subject_id', subjectId)
            .eq('user_id', user.id);

        if (topicsError) {
            console.error('[Knowledge Graph API] Topics fetch failed', topicsError);
            return NextResponse.json({ error: 'Failed to query nodes' }, { status: 500 });
        }

        if (!topics || topics.length === 0) {
            // Null state fallback format requirement
            return NextResponse.json({ nodes: [], edges: [] });
        }

        const validTopicIds = topics.map(t => t.id);

        // 2. Resolve explicitly mapped Semantic Links covering within our boundaries 
        // We only fetch constraints mapped exactly onto our explicitly constrained active topics
        const { data: edges, error: edgesError } = await supabase
            .from('topic_edges')
            .select('source_topic, target_topic, relation')
            .in('source_topic', validTopicIds);

        if (edgesError) {
            console.error('[Knowledge Graph API] Edges fetch failed', edgesError);
            return NextResponse.json({ error: 'Failed to query edge relationships' }, { status: 500 });
        }

        // 3. Normalize to pure Visualization DTO (Data Transfer Object) structures
        const nodesPayload = topics.map(v => ({
            id: v.id,
            label: v.name,
            description: v.description,
            importance: v.importance
        }));

        const edgesPayload = (edges || []).map(e => ({
            source: e.source_topic,
            target: e.target_topic,
            relation: e.relation
        }));

        // Send payload correctly matching the generic visual expectations
        return NextResponse.json({
            nodes: nodesPayload,
            edges: edgesPayload
        });

    } catch (err: unknown) {
        console.error('[Knowledge Graph API] Execution fault:', err);
        return NextResponse.json({ error: 'Internal server boundary fault' }, { status: 500 });
    }
}
