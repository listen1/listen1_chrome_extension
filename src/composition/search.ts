import { reactive, watch } from 'vue';
import MediaService from '../services/MediaService';

const condition = reactive({
  keywords: '',
  curpage: 1,
  searchType: 0,
  tab: 'netease'
});
const result = reactive({
  tracks: [],
  totalpage: 0,
  loading: false
});
async function search() {
  let { keywords, curpage, searchType, tab } = condition;
  result.tracks = [];
  result.loading = true;
  result.totalpage = 0;
  MediaService.search(tab, {
    keywords: keywords,
    curpage: curpage,
    type: searchType
  }).then((data) => {
    result.tracks = data.result;
    result.loading = false;
    result.totalpage = Math.ceil(data.total / 20);

    // scroll back to top when finish searching
    document.querySelector('.site-wrapper-innerd')?.scrollTo({ top: 0 });
  });
}
watch(condition, search);
function useSearch() {
  return { condition, result };
}

export default useSearch;
