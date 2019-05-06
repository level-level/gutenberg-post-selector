const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, ''),
		filename: 'index.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				enforce: 'pre',
				exclude: /(node_modules)/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@wordpress/default'],
							plugins: [
								"@babel/plugin-proposal-class-properties",
								"@wordpress/babel-plugin-import-jsx-pragma",
								"@babel/transform-react-jsx"
							]
						}
					},

				]
			},
			{
				test: [/.css$|.scss$/],
				use: [
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							plugins: [
								require('autoprefixer')
							]
						}
					},
					'sass-loader'
				]
			}
		]
	}
}
