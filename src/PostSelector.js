const { Component, Fragment } = wp.element;
const { decodeEntities } = wp.htmlEntities;
const { UP, DOWN, ENTER } = wp.keycodes;
const { Spinner, Popover, IconButton } = wp.components;
const { withInstanceId } = wp.compose;
const { apiFetch } = wp;
const { addQueryArgs } = wp.url;
const { __ } = wp.i18n;

const stopEventPropagation = event => event.stopPropagation();

function debounce( func, wait = 100 ) {
	let timeout;
	return function( ...args ) {
		clearTimeout( timeout );
		timeout = setTimeout( () => {
			func.apply( this, args );
		}, wait );
	};
}

class PostSelector extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindListNode = this.bindListNode.bind( this );
		this.updateSuggestions = debounce( this.updateSuggestions.bind( this ), 200 );

		this.suggestionNodes = [];

		this.state = {
			posts: [],
			showSuggestions: false,
			selectedSuggestion: null,
			input: ''
		};
	}

	componentDidUpdate() { }

	componentWillUnmount() {
		delete this.suggestionsRequest;
	}

	bindListNode( ref ) {
		this.listNode = ref;
	}

	bindSuggestionNode( index ) {
		return ref => {
			this.suggestionNodes[index] = ref;
		};
	}

	updateSuggestions( value ) {

		// Show the suggestions after typing at least 2 characters
		// and also for URLs
		if ( 2 > value.length || /^https?:/.test( value ) ) {
			this.setState({
				showSuggestions: false,
				selectedSuggestion: null,
				loading: false
			});

			return;
		}

		this.setState({
			showSuggestions: true,
			selectedSuggestion: null,
			loading: true
		});

		const request = apiFetch({
			path: addQueryArgs( '/wp/v2/search', {
				search: value,
				per_page: 20, // eslint-disable-line camelcase
				subtype: this.props.postType ? this.props.postType : 'any'
			})
		});

		request.then( posts => {

			// A fetch Promise doesn't have an abort option. It's mimicked by
			// comparing the request reference in on the instance, which is
			// reset or deleted on subsequent requests or unmounting.
			if ( this.suggestionsRequest !== request ) {
				return;
			}

			posts.map( post => {
				apiFetch({
					path: `/wp/v2/types/${post.subtype}`
				}).then( response => {
					post.typeLabel = response.name;

					this.setState({
						posts,
						loading: false
					});
				});
			});
		}).catch( () => {
			if ( this.suggestionsRequest === request ) {
				this.setState({
					loading: false
				});
			}
		});

		this.suggestionsRequest = request;
	}

	onChange( event ) {
		const inputValue = event.target.value;
		this.setState({
			input: inputValue
		});
		this.updateSuggestions( inputValue );
	}

	onKeyDown( event ) {
		const { showSuggestions, selectedSuggestion, posts, loading } = this.state;

		// If the suggestions are not shown or loading, we shouldn't handle the arrow keys
		// We shouldn't preventDefault to allow block arrow keys navigation
		if ( ! showSuggestions || ! posts.length || loading ) {
			return;
		}

		switch ( event.keyCode ) {
		case UP: {
			event.stopPropagation();
			event.preventDefault();
			const previousIndex = ! selectedSuggestion ? posts.length - 1 : selectedSuggestion - 1;
			this.setState({
				selectedSuggestion: previousIndex
			});
			break;
		}
		case DOWN: {
			event.stopPropagation();
			event.preventDefault();
			const nextIndex = null === selectedSuggestion || selectedSuggestion === posts.length - 1 ? 0 : selectedSuggestion + 1;
			this.setState({
				selectedSuggestion: nextIndex
			});
			break;
		}
		case ENTER: {
			if ( null !== this.state.selectedSuggestion ) {
				event.stopPropagation();
				const post = this.state.posts[this.state.selectedSuggestion];
				this.selectLink( post );
			}
		}
		}
	}

	selectLink( post ) {

		apiFetch({
			path: `/wp/v2/types/${post.subtype}`
		}).then( response => {
			let restbase = response.rest_base; // eslint-disable-line camelcase

			// get the "full" post data if a post was selected. this may be something to add as a prop in the future for custom use cases.
			apiFetch({
				path: `/wp/v2/${restbase}/${post.id}?_embed&`
			}).then( response => {

				// Add featured image sizes object if available
				let post;
				if ( 1 > response.featured_media || ! response.featured_media ) {
					post = {
						...response,
						featuredImage: false
					};
				} else {
					post = {
						...response,
						featuredImage: response._embedded['wp:featuredmedia'][0].media_details.sizes || false
					};
				}

				// send data to the block;
				this.props.onPostSelect( post );
			});
			this.setState({
				input: '',
				selectedSuggestion: null,
				showSuggestions: false
			});

			// Pass the post type to the block
			this.props.setPostType( this.props.postType );
		});
	}

	renderSelectedPosts() {

		// show each post in the list.
		return (
			<ul className="post-selector-selected-list">
				{this.props.posts.map( ( post, i ) => (
					<li className="post-selector-selected-list__item" key={post.id}>
						<div className="selected-post">
							<span className="selected-post__post">{ post.title.rendered } <strong>{ post.typeLabel }</strong></span>
							<span className="selected-post__button">
								{0 !== i ? (
									<IconButton
										className="post-selector-button"
										icon="arrow-up-alt2"
										onClick={() => {
											this.props.posts.splice( i - 1, 0, this.props.posts.splice( i, 1 )[0]);
											this.props.onChange( this.props.posts );
											this.setState({
												state: this.state
											});
										}}
									/>
								) : null}

								{this.props.posts.length - 1 !== i ? (
									<IconButton
										className="post-selector-button"
										icon="arrow-down-alt2"
										onClick={() => {
											this.props.posts.splice( i + 1, 0, this.props.posts.splice( i, 1 )[0]);
											this.props.onChange( this.props.posts );
											this.setState({
												state: this.state
											});
										}}
									/>
								) : null}

								<IconButton
									className="post-selector-button"
									icon="no"
									onClick={() => {
										this.props.posts.splice( i, 1 );
										this.props.onChange( this.props.posts );

										// force a re-render.
										this.setState({
											state: this.state
										});
									}}
								/>
							</span>
						</div>
					</li>
				) )}
			</ul>
		);
	}

	render() {
		const { autoFocus = true, instanceId } = this.props;
		const { showSuggestions, posts, selectedSuggestion, loading, input } = this.state;
		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<Fragment>
				{this.renderSelectedPosts()}
				<div className="post-selector-search">
					<label htmlFor="post-selector-search" className="post-selector-search__label">
						{ __( 'Zoeken', 'clarkson-theme' ) }
					</label>
					<input
						id="post-selector-search"
						className="post-selector-search__input"
						autoFocus={ autoFocus }
						type="search"
						aria-label={ 'URL' }
						required
						value={ input }
						onChange={ this.onChange }
						onInput={ stopEventPropagation }
						placeholder={ __( 'Typ om te zoeken', 'clarkson-theme' ) }
						onKeyDown={ this.onKeyDown }
						role="combobox"
						aria-expanded={ showSuggestions }
						aria-autocomplete="list"
						aria-owns={ `editor-url-input-suggestions-${instanceId}` }
						aria-activedescendant={ null !== selectedSuggestion ? `editor-url-input-suggestion-${instanceId}-${selectedSuggestion}` : undefined }
					/>

					{ loading && <Spinner /> }
				</div>

				{ showSuggestions && !! posts.length && (
					<Popover position="bottom" noArrow focusOnMount={ false }>
						<div className="post-selector-suggestions">
							<div
								className="editor-url-input__suggestions"
								id={`editor-url-input-suggestions-${instanceId}`}
								ref={ this.bindListNode }
								role="listbox">
								{posts.map( ( post, index ) => {
									return (
										<button
											key={ post.id }
											role="option"
											tabIndex="-1"
											id={`editor-url-input-suggestion-${instanceId}-${index}`}
											ref={this.bindSuggestionNode( index )}
											className={ `editor-url-input__suggestion ${index === selectedSuggestion ? 'is-selected' : ''}` }
											onClick={() => this.selectLink( post )}
											aria-selected={ index === selectedSuggestion }>
											<div className="suggested-item">
												<span className="suggested-item__title">{ decodeEntities( post.title ) || '(no title)'}</span>
												<span className="suggested-item__type">({ decodeEntities( post.typeLabel ) })</span>
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</Popover>
				)}
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default withInstanceId( PostSelector );
