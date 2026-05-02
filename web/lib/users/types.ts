export type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

export type PaginatedUsersResponse = {
  data: UserRow[];
  links: Record<string, unknown>;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type UserDetailResponse = {
  data: UserRow;
};
