# Gutenberg PostSelector

REQUIRES WordPress 5.0+

This is a React component built for Gutenberg that allows you to attach pages and posts like AddBySearch in the WP 5.0+ editor. 

## Usage

block.js
```javascript

import PostSelector from '../__post-selector';

const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { Component } = wp.element;
const { InspectorControls } = wp.editor;
const { PanelBody } = wp.components;

registerBlockType( 'namespace/name-of-your-block', {
	title: __( 'Autofiller' ),
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
						<PanelBody title={ __( 'Selectie', 'clarkson-theme' ) }>
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

pass the singular name of a custom or built-in post type to limit results to that type (optional). 

`data <String>[] (optional)`

the data prop allows you to define an array of strings that map to object keys from the REST API. (does not support nesting right now).


`onPostSelect : function => <Post>[]`


onPostSelect runs when a user selects a new post from the suggestion list upon typing. It returns a new array of all selected posts and should replace the data in your posts attribute.

`onChange: function => <Post>[]`

onChange runs when the user reorders the array of posts or removes a post from the array. it returns a new array that should replace your posts attribute.

`limit: <Number> (optional)`

Limit the number of posts a user is allowed to select.
