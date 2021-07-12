///<reference path='../std/libStdDev.ts' />

interface IOnlineAPI {
    getRandomKeyFrom(keysList: string[]): IResult<string, any>;
}

namespace extOnline {


    const logger = libLogger.current;
    const sprintf = sprintfjs.sprintf;


    var APIKEY_OMDB:string[] = [
    ];
    var APIKEY_TMDB:string[] = [
    ];
    var APIKEY_FANARTTV:string[] = [
    ]



    class MovSite implements IOnlineAPI {
        constructor() {}
        getRandomKeyFrom(keysList: string[]): IResult<string, any> {
            if (keysList.length === 0) {
                return Exc(ex.NotImplementedYet, arguments.callee, 'API key reading logic');
            }
            function getRandomInt(max: number) {
                return Math.floor(Math.random() * max);
            }
            return g.ResultOk(keysList.length === 1 ? keysList[0] : keysList[getRandomInt(keysList.length)]);
        }
    }



    class FATV extends MovSite {

        // FANART API object
        // https://fanarttv.docs.apiary.io/
        static APIURL_MOV = 'http://webservice.fanart.tv/v3/movies/%s?api_key=%s';
        static APIURL_TV  = 'http://webservice.fanart.tv/v3/tv/%s?api_key=%s';

        constructor() {
            super();
        }
        getNextApiKey() {
            return this.getRandomKeyFrom(APIKEY_FANARTTV);
        }
        getImagesMovURL(sID: string) {
            return sID ? sprintf(FATV.APIURL_MOV, sID, this.getNextApiKey()) : '';
        }
        getImagesTVURL(sID: string) {
            return sID ? sprintf(FATV.APIURL_TV, sID, this.getNextApiKey()) : '';
        }

    }



    class OMDB extends MovSite {

        // OMDB API object
        // https://www.omdbapi.com/
        static APIURL_SEARCH_BOTH = 'http://www.omdbapi.com/?apikey=%s&plot=full&t=%s&y=%d';
        static APIURL_SEARCH_NAME = 'http://www.omdbapi.com/?apikey=%s&plot=full&t=%s';
        static APIURL_DETAILS     = 'http://www.omdbapi.com/?apikey=%s&plot=full&i=%s';

        constructor() {
            super();
        }

        getNextApiKey() {
            return this.getRandomKeyFrom(APIKEY_OMDB);
        }
        getSearchURL(sName: string, iYear: number) {
            if (!sName) {
                return '';
            } else if (sName && !iYear) {
                return sprintf(OMDB.APIURL_SEARCH_NAME, this.getNextApiKey(), encodeURIComponent(sName));
            } else {
                return sprintf(OMDB.APIURL_SEARCH_BOTH, this.getNextApiKey(), encodeURIComponent(sName), iYear);
            }
        }
        getDetailsURL(sID: string) {
            return sID ? sprintf(OMDB.APIURL_DETAILS, this.getNextApiKey(), sID) : '';
        }

    }



    // TMDB API object
    // https://developers.themoviedb.org/3/
    class TMDB extends MovSite {

        static APIURL_CONFIG    = 'https://api.themoviedb.org/3/configuration?api_key=%s';
        static APIURL_GENRES_MOV= 'https://api.themoviedb.org/3/genre/movie/list?api_key=%s';
        static APIURL_GENRES_TV = 'https://api.themoviedb.org/3/genre/tv/list?api_key=%s';
        static APIURL_FINDIMDB  = 'https://api.themoviedb.org/3/find/%s?api_key=%s&external_source=imdb_id';
        static APIURL_DETAILS   = 'https://api.themoviedb.org/3/movie/%s?api_key=%s';

        /*
            search
            https://api.themoviedb.org/3/search/movie?include_adult=true&query=Leon&year=1994&api_key=%s

            movie recommendations
            https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key=%s

            movie images
            https://api.themoviedb.org/3/movie/{movie_id}/images?api_key=%s

            credits
            https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key=%s

            alternative titles
            https://api.themoviedb.org/3/movie/{movie_id}/alternative_titles?api_key=%s

            external ID's, e.g. IMDB, field imdb_id
            https://api.themoviedb.org/3/movie/{movie_id}/external_ids?api_key=%s

            keywords
            https://api.themoviedb.org/3/movie/{movie_id}/keywords?api_key=%s

            reviews
            https://api.themoviedb.org/3/movie/{movie_id}/reviews?api_key=%s

            similar movies
            https://api.themoviedb.org/3/movie/{movie_id}/similar?api_key=%s


            POST & DELETE
            read before
            https://developers.themoviedb.org/3/authentication/create-request-token
            https://developers.themoviedb.org/3/authentication/validate-request-token
            https://developers.themoviedb.org/3/authentication/delete-session

            rate movie
            https://api.themoviedb.org/3/movie/{movie_id}/rating?api_key=%s

            delete rating
            https://api.themoviedb.org/3/movie/{movie_id}/rating?api_key=%s

        */

        constructor() {
            super();
        }
        getNextApiKey() {
            return this.getRandomKeyFrom(APIKEY_TMDB);
        }
        getConfigURL() {
            return sprintf(TMDB.APIURL_CONFIG, this.getNextApiKey());
        }
        getGenresMovURL() {
            return sprintf(TMDB.APIURL_GENRES_MOV, this.getNextApiKey());
        }
        getGenresTVURL() {
            return sprintf(TMDB.APIURL_GENRES_TV, this.getNextApiKey());
        }
        getFindFromIMDBURL(sID_IMDB: string) {
            return sID_IMDB ? sprintf(TMDB.APIURL_FINDIMDB, sID_IMDB, this.getNextApiKey()) : '';
        }
        getDetailsURL(sID: string) {
            return sID ? sprintf(TMDB.APIURL_DETAILS, sID, this.getNextApiKey()) : '';
        }


    }

}
