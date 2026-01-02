'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Place {
  id: string;
  name: string;
  address: string | null;
  order_index: number;
  memo: string | null;
}

interface PlaceListProps {
  places: Place[];
  onReorder: (placeIds: string[]) => void;
  onDelete: (placeId: string) => void;
}

function PlaceItem({ place, isDragging }: { place: Place; isDragging?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-white p-2 ${
        isDragging ? 'shadow-lg border-pink-300' : 'border-gray-200'
      }`}
    >
      <div className="cursor-grab text-gray-400 hover:text-gray-600 touch-none">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
        {place.address && (
          <p className="text-xs text-gray-500 truncate">{place.address}</p>
        )}
      </div>

      <div className="w-4 h-4" />
    </div>
  );
}

function SortablePlace({ place, onDelete }: { place: Place; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border bg-white p-2 ${
        isDragging ? 'border-pink-300' : 'border-gray-200'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 touch-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
        {place.address && (
          <p className="text-xs text-gray-500 truncate">{place.address}</p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function PlaceList({ places, onReorder, onDelete }: PlaceListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((p) => p.id === active.id);
      const newIndex = places.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(places, oldIndex, newIndex);
      onReorder(newOrder.map((p) => p.id));
    }
  }

  const activePlace = activeId ? places.find((p) => p.id === activeId) : null;

  if (places.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        아직 장소가 없어요
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {places.map((place) => (
            <SortablePlace
              key={place.id}
              place={place}
              onDelete={() => onDelete(place.id)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activePlace ? <PlaceItem place={activePlace} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
