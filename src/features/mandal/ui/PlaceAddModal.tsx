'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/shared/ui/Modal';

interface SearchResult {
  name: string;
  address: string;
  category: string;
  mapx: string;
  mapy: string;
}

interface PlaceAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (place: {
    name: string;
    address: string | null;
    memo: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => void;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || 'h-5 w-5'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// 네이버 좌표를 WGS84 좌표로 변환
function convertNaverCoord(mapx: string, mapy: string): { lat: number; lng: number } {
  // 네이버 API는 KATECH 좌표계를 사용하지만, 최근에는 WGS84도 지원
  // mapx, mapy는 1/10000000 단위의 경도/위도
  const lng = parseFloat(mapx) / 10000000;
  const lat = parseFloat(mapy) / 10000000;
  return { lat, lng };
}

export function PlaceAddModal({ open, onClose, onAdd }: PlaceAddModalProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 선택된 장소 또는 수동 입력
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [memo, setMemo] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setMode('search');
      setQuery('');
      setResults([]);
      setError(null);
      setSelectedPlace(null);
      setManualName('');
      setManualAddress('');
      setMemo('');
    }
  }, [open]);

  // 검색 (디바운스)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      setError(null);

      try {
        const response = await fetch(`/api/search-place?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok) {
          setResults(data.places || []);
        } else {
          setError(data.error || '검색 실패');
        }
      } catch {
        setError('검색에 실패했습니다');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // 장소 선택
  function handleSelectPlace(place: SearchResult) {
    setSelectedPlace(place);
    setQuery('');
    setResults([]);
  }

  // 장소 추가
  function handleAdd() {
    if (mode === 'search' && selectedPlace) {
      const { lat, lng } = convertNaverCoord(selectedPlace.mapx, selectedPlace.mapy);
      onAdd({
        name: selectedPlace.name,
        address: selectedPlace.address,
        memo: memo.trim() || null,
        latitude: lat,
        longitude: lng,
      });
    } else if (mode === 'manual' && manualName.trim()) {
      onAdd({
        name: manualName.trim(),
        address: manualAddress.trim() || null,
        memo: memo.trim() || null,
        latitude: null,
        longitude: null,
      });
    }
    onClose();
  }

  const canAdd = mode === 'search' ? !!selectedPlace : !!manualName.trim();

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Content className="max-w-md">
        <Modal.Header>장소 추가</Modal.Header>

        <Modal.Body>
          <div className="space-y-4">
            {/* 모드 선택 탭 */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setMode('search')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'search'
                    ? 'bg-white text-pink-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                지도 검색
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-white text-pink-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                직접 입력
              </button>
            </div>

            {mode === 'search' ? (
              <>
                {/* 검색 입력 */}
                {!selectedPlace && (
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="장소명 또는 주소 검색"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-gray-900 focus:border-pink-500 focus:outline-none"
                      autoFocus
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* 검색 결과 */}
                {!selectedPlace && results.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                    {results.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPlace(place)}
                        className="w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-pink-50"
                      >
                        <div className="font-medium text-gray-900">{place.name}</div>
                        <div className="text-sm text-gray-500">{place.address}</div>
                        {place.category && (
                          <div className="mt-1 text-xs text-gray-400">{place.category}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* 선택된 장소 */}
                {selectedPlace && (
                  <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{selectedPlace.name}</div>
                        <div className="text-sm text-gray-600">{selectedPlace.address}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPlace(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                )}
              </>
            ) : (
              <>
                {/* 직접 입력 모드 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    장소명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="예: 스타벅스 강남점"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">주소</label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="주소 입력 (선택)"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* 메모 입력 (공통) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="이 장소에 대한 메모 (선택)"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                className="flex-1 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
