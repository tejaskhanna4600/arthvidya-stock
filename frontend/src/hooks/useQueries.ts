import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { StockView, TeamView, News, UserProfile } from '../backend/types';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stock Queries
export function useGetAllStocks() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, StockView]>>({
    queryKey: ['stocks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStocks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, initialPrice, industry }: { name: string; initialPrice: number; industry?: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStock(name, initialPrice, industry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
  });
}

export function useUpdateStockPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, newPrice }: { name: string; newPrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStockPrice(name, newPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
  });
}

export function useUpdateStockMeta() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      newName,
      industry,
    }: {
      name: string;
      newName?: string;
      industry?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStockMeta(name, { newName, industry });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useBatchUpdateStockPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }: { updates: { name: string; newPrice: number }[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStockPricesBatch(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useAdminUndo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminUndo();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

// Team Queries
export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, TeamView]>>({
    queryKey: ['teams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerTeam() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamView | null>({
    queryKey: ['callerTeam'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerTeam();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, initialCash, password }: { name: string; initialCash: number; password?: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeam(name, initialCash, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeamCash() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, amount }: { name: string; amount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamCash(name, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useUpdateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      newName,
      password,
    }: {
      name: string;
      newName?: string;
      password?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeam(name, { newName, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useDeleteTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTeam(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

// Market State Queries
export function useGetMarketState() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['marketState'],
    queryFn: async () => {
      if (!actor) return { roundNumber: 0, isOpen: false };
      return actor.getMarketState();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStartRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.startRound();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketState'] });
    },
  });
}

export function useEndRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.endRound();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketState'] });
    },
  });
}

export function useSetRoundDuration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (minutes: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setRoundDuration(minutes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketState'] });
    },
  });
}

export function useStartBreak() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.startBreak();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketState'] });
    },
  });
}

export function useEndBreak() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.endBreak();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketState'] });
    },
  });
}

// News Queries
export function useGetAllNews() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[number, News]>>({
    queryKey: ['news'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLatestNews() {
  const { actor, isFetching } = useActor();

  return useQuery<News | null>({
    queryKey: ['latestNews'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLatestNews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddNews() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ headline, description }: { headline: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addNews(headline, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['latestNews'] });
    },
  });
}

export function useFlashNews() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.flashNews(newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['latestNews'] });
    },
  });
}

// Chaos card (for screen display)
export function useGetChaosLatest() {
  const { actor, isFetching } = useActor();
  return useQuery<{ card: string | null }>({
    queryKey: ['chaosLatest'],
    queryFn: async () => {
      if (!actor) return { card: null };
      return actor.getChaosLatest();
    },
    enabled: !!actor && !isFetching,
  });
}

// Leaderboard Query
export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, number]>>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

// Trading Mutations
export function useBuyStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamName,
      stockName,
      quantity,
    }: {
      teamName: string;
      stockName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.buyStock(teamName, stockName, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerTeam'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useSellStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamName,
      stockName,
      quantity,
    }: {
      teamName: string;
      stockName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sellStock(teamName, stockName, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerTeam'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useShortStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamName,
      stockName,
      quantity,
    }: {
      teamName: string;
      stockName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.shortStock(teamName, stockName, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerTeam'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useCoverShort() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamName,
      stockName,
      quantity,
    }: {
      teamName: string;
      stockName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.coverShort(teamName, stockName, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerTeam'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
