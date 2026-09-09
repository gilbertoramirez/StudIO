'use client';

import { StudioProvider, useStudio } from '@/context/StudioContext';
import Header from '@/components/Header';
import Tabs from '@/components/Tabs';
import PageBar from '@/components/PageBar';
import DocumentView from '@/components/views/DocumentView';
import ChatView from '@/components/views/ChatView';
import PlanView from '@/components/views/PlanView';
import ExamView from '@/components/views/ExamView';

function StudioShell() {
  const { tab } = useStudio();

  return (
    <>
      <Header />
      <Tabs />
      <PageBar />
      <main>
        {tab === 'documento' && <DocumentView />}
        {tab === 'chat' && <ChatView />}
        {tab === 'plan' && <PlanView />}
        {tab === 'examen' && <ExamView />}
      </main>
    </>
  );
}

export default function StudioApp() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
