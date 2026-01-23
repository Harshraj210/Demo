import { NoteEditor } from './NoteEditor';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <NoteEditor id={id} key={id} />;
}
