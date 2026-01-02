'use client';

interface Place {
  id: string;
  name: string;
  order_index: number;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  isNew?: boolean;
}

interface PlaceListProps {
  places: Place[];
  onReorder: (placeIds: string[]) => void;
  onDelete: (placeId: string) => void;
  onOpenDetail: (place: Place) => void;
  placePhotosCounts?: Record<string, number>;
}

function PlaceItem({
  place,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  onOpenDetail,
  photoCount,
}: {
  place: Place;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onOpenDetail: () => void;
  photoCount?: number;
}) {
  return (
    <div
      onClick={onOpenDetail}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 cursor-pointer transition-all active:scale-[0.98] active:bg-pink-50 hover:bg-gray-50"
    >
      {/* 순서 변경 버튼 */}
      <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="위로"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="아래로"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* 장소 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
            {place.memo && (
              <p className="text-xs text-pink-500 truncate">{place.memo}</p>
            )}
          </div>
          {/* 사진 개수 배지 */}
          {photoCount && photoCount > 0 && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {photoCount}
            </span>
          )}
          {/* 새 장소 표시 */}
          {place.isNew && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
              새 장소
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 text-gray-400 hover:text-red-500"
        title="삭제"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function PlaceList({ places, onReorder, onDelete, onOpenDetail, placePhotosCounts }: PlaceListProps) {
  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...places];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder.map((p) => p.id));
  }

  function handleMoveDown(index: number) {
    if (index === places.length - 1) return;
    const newOrder = [...places];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorder(newOrder.map((p) => p.id));
  }

  if (places.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        아직 장소가 없어요
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {places.map((place, index) => (
        <PlaceItem
          key={place.id}
          place={place}
          index={index}
          total={places.length}
          onMoveUp={() => handleMoveUp(index)}
          onMoveDown={() => handleMoveDown(index)}
          onDelete={() => onDelete(place.id)}
          onOpenDetail={() => onOpenDetail(place)}
          photoCount={placePhotosCounts?.[place.id]}
        />
      ))}
    </div>
  );
}
