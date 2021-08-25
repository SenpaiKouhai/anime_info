const express = require('express')
const app = express();
const cors = require('cors')
const NodeCache = require('node-cache')
const { default: axios } = require('axios');
const port = process.env.PORT || 5000

// you can set the expire time on stdTTL
const cache = new NodeCache({ stdTTL: 5 }) // time format is seconds

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.send("just append the mal id like this https://anime-get-info.vercel.app/api/(your mal id)")
})

app.get(`/api/:id`, (req, res) => {
    if(cache.has(req.params.id)) {
        return res.json(cache.get(req.params.id))
    } else {
        axios.get(`https://api.jikan.moe/v4/anime/${req.params.id}`)
        .then( resp => {
            let data = resp.data.data
    
            // title section
            let title = data.title
            let title_eng = data.title_english
            let title_jp = data.title_japanese
            let title_other = data.title_synonyms // array format
    
            let image_jpg; 
            if (data.images.jpg.large_image_url) {
                image_jpg  = data.images.jpg.large_image_url
            } else {
                // get the available images, json format
                image_jpg  = data.images.jpg.small_image_url
            }
    
            let image_webp;
            if (data.images.webp.large_image_url) {
                image_webp  = data.images.webp.large_image_url
            } else {
                // get the available images, json format
                image_webp  = data.images.webp.small_image_url
            }
    
            let trailer_url = data.trailer.embed_url
            let trailer_thumbnail;
            // check first if hd image is available
            if (data.trailer.images.large_image_url) {
                trailer_thumbnail = data.trailer.images.large_image_url
            } else {
                // get the available images, json format
                trailer_thumbnail = data.trailer.images.small_image_url
            }
            let synopsis = data.synopsis
    
            // Information
            let type = data.type
            let total_episodes = data.episodes
            let status = data.status
            let premiered = data.season.charAt(0).toUpperCase() + data.season.slice(1) + " " + data.year
            let broadcast = data.broadcast.string
            let producers = []
            data.producers.map( (i) => producers.push(i.name) )
            let studios = []
            data.studios.map( (i) => studios.push(i.name) )
            let date_aired = data.aired.string
            let source = data.source
            let genre = []
            data.genres.map( i => genre.push(i.name) )
            let duration = data.duration
            let rating = data.rating
    
            let mal_score = data.score
            let mal_rank = data.rank
            
            let filtered = { 
                title, 
                title_eng,
                title_jp, 
                title_other,
                image_jpg,
                image_webp,
                trailer_url,
                trailer_thumbnail ,
                synopsis,
    
                type,
                total_episodes,
                status,
                premiered, 
                broadcast,
                producers,
                studios,
                date_aired,
                source,
                genre, 
                duration,
                rating,
    
                mal_score,
                mal_rank
            }

            cache.set(req.params.id, filtered)

            res.json(filtered)
        } )
        .catch( err => res.status(404).json({ error: "Something went wrong!", message: err }) )
    }

} )

// pictures section on mal
app.get('/api/:id/images', (req, res) => {
    try {
        if(cache.has(req.params.id)) {
            return res.json(cache.get(req.params.id))
        } else {
            axios.get(`https://api.jikan.moe/v4/anime/${req.params.id}/pictures`)
            .then( resp => {
                let data = resp.data.data
                // console.log(data)
                let images = []
                data.map( (data, index) => {
                    images.push({
                        index: index,
                        image: data.large_image_url
                    })
                } )
                cache.set(req.params.id, images)
                res.json({ images })
            } )
            .catch( err => res.status(404).json({ success: false, msg: err }) )
        }
       
    } catch (e) {
        res.status(404).json({ success: false, msg: e })
    }
   
} )

app.get('/stats', (req, res) => {
    res.send(cache.stats)
} )

app.listen( port, () => {
    console.log(`Connected to port ${port}`)
} )