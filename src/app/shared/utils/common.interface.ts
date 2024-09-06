export interface IApiResponse{
  message : string
  status: boolean
  status_code: number
  data:any
}

export interface IPagination{
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNext_page: boolean;
  prevPage: any;
  nextPage: any;

}
