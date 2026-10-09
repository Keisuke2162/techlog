'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepository } from '@/shared/repository/context';
import { createTag, deleteTag, mergeTag, updateTag } from '@/features/tags/application/usecases';
import type { Tag, TagColor } from '@/features/articles/domain/types';

export const TQK = {
  tags: () => ['tags'] as const,
  tag: (id: string) => ['tag', id] as const,
};

export function useTags() {
  const repo = useRepository();
  return useQuery({ queryKey: TQK.tags(), queryFn: () => repo.tags.list() });
}

export function useTag(id: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: TQK.tag(id ?? '__none__'),
    queryFn: () => (id ? repo.tags.getById(id) : Promise.resolve<Tag | undefined>(undefined)),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: TagColor }) => createTag(repo, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TQK.tags() }),
  });
}

export function useUpdateTag() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; color?: TagColor }) => updateTag(repo, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TQK.tags() });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteTag() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(repo, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TQK.tags() });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useMergeTags() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { fromId: string; intoId: string }) => mergeTag(repo, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TQK.tags() });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
