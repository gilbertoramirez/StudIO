'use client';

import { useStudio } from '@/context/StudioContext';

export default function PageBar() {
  const { totalPages, pageFrom, pageTo } = useStudio();

  if (!totalPages) return <div className="page-bar" />;

  const left = ((pageFrom - 1) / totalPages) * 100;
  const width = ((pageTo - pageFrom + 1) / totalPages) * 100;

  return (
    <div className="page-bar visible">
      <div className="page-bar-track">
        <div className="page-bar-fill" style={{ left: left + '%', width: width + '%' }} />
      </div>
      <span className="page-bar-label">
        pp. {pageFrom}–{pageTo} de {totalPages}
      </span>
    </div>
  );
}
