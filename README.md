# Gutenberg PostSelector

REQUIRES WordPress 5.0+

This is a React component built for Gutenberg that allows you to attach pages and posts like AddBySearch in the WP 5.0+ editor. 

## Installation

Create a new folder called `__post-selector` within the blocks folder in `src/blocks`.
Create a new file `index.js` file in that folder and add:

```javascript
// PostSelector styling
import './src/post-selector.scss';

// PostSelector script
import PostSelector from './src/PostSelector';
export default PostSelector;

```

Create a folder called `src` within the new `__post-selector` folder and in that folder copy & paste the `post-selector.scss` & `PostSelector.js` files from this repo.

## Output

```javascript
{
	"posts": [
		{ post 1 },
		{ post 2 },
		--etc
	],
	"post_type": "any",
	"post_ids": [ 1, 22, 2 ]
}
```

## Usage

block.js
```javascript

/* eslint-disable camelcase */
import PostSelector from '../__post-selector';

const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { Component } = wp.element;
const { InspectorControls } = wp.editor;
const { PanelBody } = wp.components;

registerBlockType( 'namespace/name-of-your-block', {
	title: __( 'PostSelector' ),
	icon: 'universal-access-alt',
	category: 'common',
	keywords: [
		__( 'PostSelector' ),
		__( 'post' ),
		__( 'selector' )
	],
	attributes: {
		posts: {
			type: 'array',
			default: []
		},
		post_type: {
			type: 'string'
		},
		post_ids: {
			type: 'array',
			default: []
		}
	},
	edit: class extends Component {
		constructor( props ) {
			super( ...arguments );
			this.props = props;

			this.getPostIds = this.getPostIds.bind( this );
			this.addPost = this.addPost.bind( this );
			this.onPostChange = this.onPostChange.bind( this );
		}

		/**
		* Empty the post_ids props
		* Fill post_ids props with post_ids from posts array
		*/
		getPostIds() {

			// Empty attributes of post_ids
			this.props.attributes.post_ids.splice( 0, this.props.attributes.post_ids.length );

			// Map through posts in the posts attribute and push their id into the post_ids attribute
			this.props.attributes.posts.map( ( item ) => {
				this.props.attributes.post_ids.push( item.id );
			});
		}

		/**
		* Add a post
		* @param  {object}  post  The post object
		*/
		addPost( post ) {

			// Push posts and post ids in the attributes
			this.props.attributes.posts.push( post );
			this.props.attributes.post_ids.push( post.id );

			// Set the posts and post ids as attributes
			this.props.setAttributes({
				posts: [ ...this.props.attributes.posts ],
				post_ids: [ ...this.props.attributes.post_ids ]
			});
		}

		/**
		* Update post array
		* @param  {object}  newValue  The post object
		*/
		onPostChange( newValue ) {
			this.props.setAttributes({
				posts: [ ...newValue ]
			});
			this.getPostIds();
		}

		render() {
			const {
				attributes: {
					posts
				},
				setAttributes
			} = this.props;

			return (
				<div>
					<InspectorControls>
						<PanelBody title={ __( 'Selectie' ) }>
							<PostSelector
								postType="any"
								setPostType={ posttype => {
									setAttributes({
										post_type: posttype
									});
								}}
								posts={ posts }
								onPostSelect={ post => this.addPost( post ) }
								onChange={ newValue => this.onPostChange( newValue ) }
							/>
						</PanelBody>
					</InspectorControls>
					<div className="output">
						<h2>PostSelector</h2>
						<ul className="list-unstyled">
							{
								posts.map( ( post, key ) => {
									return (
										<li key={ key }>{ post.title.rendered }</li>
									);
								})
							}
						</ul>
					</div>
				</div>
			);
		}
	},
	save() {
		return null;
	}
});

```


### Props

`posts : <Post>[]`

posts should refer to an attribute in your block that is of type: 'array'. this is used internally by the component to update, re-order, and control deletion of posts from the selction.

`postType : <String> (optional)`

the data prop allows you to define an array of strings that map to object keys from the REST API.

`onPostSelect : function => <Post>[]`

onPostSelect runs when a user selects a new post from the suggestion list upon typing. It returns a new array of all selected posts and should replace the data in your posts attribute.

`onChange: function => <Post>[]`

onChange runs when the user reorders the array of posts or removes a post from the array. it returns a new array that should replace your posts attribute.

# Awesome combination time

PostSelector can be combined with the [AutoFiller](https://github.com/kevinpoot/gutenberg-autofill) component. Install it via `npm install @kevinio/gutenberg-autofill --save`

Example block.js:

```javascript

/* eslint-disable camelcase */
import PostSelector from '../__post-selector';
import AutoFiller from '@kevinio/gutenberg-autofill';

const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { Component } = wp.element;
const { InspectorControls } = wp.editor;
const { PanelBody } = wp.components;

registerBlockType( 'namespace/name-of-your-block', {
	title: __( 'Title of your block' ),
	icon: 'universal-access-alt',
	category: 'common',
	keywords: [
		__( 'name' ),
		__( 'your' ),
		__( 'block' )
	],
	attributes: {
		posts: {
			type: 'array',
			default: []
		},
		post_type: {
			type: 'string'
		},
		post_ids: {
			type: 'array',
			default: []
		},
		autofill: {
			type: 'boolean',
			default: false
		},
		amount: {
			type: 'number',
			default: 1
		},
		remainingPosts: {
			type: 'number',
			default: 0
		},
		useTaxonomy: {
			type: 'boolean',
			default: false
		},
		terms: {
			type: 'array',
			default: []
		}
	},
	edit: class extends Component {
		constructor( props ) {
			super( ...arguments );
			this.props = props;

			this.getPostIds = this.getPostIds.bind( this );
			this.addPost = this.addPost.bind( this );
			this.onPostChange = this.onPostChange.bind( this );
			this.calculateRemainingPosts = this.calculateRemainingPosts.bind( this );
		}

		componentDidMount() {
			this.calculateRemainingPosts( this.props.attributes.amount );
		}

		/**
		* Empty the post_ids props
		* Fill post_ids props with post_ids from posts array
		*/
		getPostIds() {

			// Empty attributes of post_ids
			this.props.attributes.post_ids.splice( 0, this.props.attributes.post_ids.length );

			// Map through posts in the posts attribute and push their id into the post_ids attribute
			this.props.attributes.posts.map( ( item ) => {
				this.props.attributes.post_ids.push( item.id );
			});
		}

		/**
		* Add a post
		* @param  {object}  post  The post object
		*/
		addPost( post ) {

			// Push posts and post ids in the attributes
			this.props.attributes.posts.push( post );
			this.props.attributes.post_ids.push( post.id );

			// Set the posts and post ids as attributes
			this.props.setAttributes({
				posts: [ ...this.props.attributes.posts ],
				post_ids: [ ...this.props.attributes.post_ids ]
			});

			// Calculate remaining posts
			this.calculateRemainingPosts( this.props.attributes.amount );
		}

		/**
		* Update post array
		* @param  {object}  newValue  The post object
		*/
		onPostChange( newValue ) {
			this.props.setAttributes({
				posts: [ ...newValue ]
			});
			this.getPostIds();

			// Calculate remaining posts
			this.calculateRemainingPosts( this.props.attributes.amount );
		}

		/**
		* Calculate remaing post count based on number of selected posts and the number selected in the RangeControl
		* @param  {number}  amount  The post object
		*/
		calculateRemainingPosts( amount ) {
			if ( amount ) {
				this.props.setAttributes({
					remainingPosts: Math.max( 0, amount - this.props.attributes.posts.length )
				});
			}
		}

		render() {
			const {
				attributes: {
					posts,
					remainingPosts,
					autofill,
					amount,
					terms,
					useTaxonomy
				},
				setAttributes
			} = this.props;

			return (
				<div>
					<InspectorControls>
						<PanelBody title={ __( 'Selectie' ) }>
							<PostSelector
								postType="any"
								setPostType={ posttype => {
									setAttributes({
										post_type: posttype
									});
								}}
								posts={ posts }
								onPostSelect={ post => this.addPost( post ) }
								onChange={ newValue => this.onPostChange( newValue ) }
							/>
						</PanelBody>
						<AutoFiller
							limit='20'
							autofill={ autofill }
							autofillState={ state => {
								if ( ! state.taxonomy ) {
									setAttributes({
										autofill: state.autofill
									});
								} else {
									setAttributes({
										autofill: state.autofill,
										useTaxonomy: state.taxonomy
									});
								}
							}}
							amount={ amount }
							setAmount={ number => {
								setAttributes({
									amount: number
								});

								this.calculateRemainingPosts( number );
							}}
							taxonomy={ useTaxonomy }
							setTaxonomyState={ state => {
								setAttributes({
									useTaxonomy: state
								});
							}}
							terms={ terms }
							setTerms={ terms => {
								setAttributes({
									terms: terms
								});
							}}
						/>
					</InspectorControls>
					<div className="output">
						<h2>Autofiller</h2>
						<ul className="list-unstyled">
							{
								posts.map( ( post, key ) => {
									return (
										<li key={ key }>{ post.title.rendered }</li>
									);
								})
							}
						</ul>
						{ autofill && 0 < remainingPosts ? (
							<div>
								{ 1 == amount ? (
									__( `Dit blok wordt aangevuld met ${ remainingPosts } item` )
								) :
									__( `Dit blok wordt aangevuld met ${ remainingPosts } items` )
								}
							</div>
						) : null }
					</div>
				</div>
			);
		}
	},
	save() {
		return null;
	}
});

```
