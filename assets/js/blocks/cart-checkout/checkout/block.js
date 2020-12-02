/**
 * External dependencies
 */
import classnames from 'classnames';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PlaceOrderButton,
	Policies,
	ReturnToCartButton,
} from '@woocommerce/base-components/cart-checkout';
import {
	CheckoutProvider,
	useCheckoutContext,
	useEditorContext,
	useValidationContext,
} from '@woocommerce/base-context';
import { useStoreCart, useStoreNotices } from '@woocommerce/base-hooks';
import { CheckoutExpressPayment } from '@woocommerce/base-components/payment-methods';
import {
	Sidebar,
	SidebarLayout,
	Main,
} from '@woocommerce/base-components/sidebar-layout';
import withScrollToTop from '@woocommerce/base-hocs/with-scroll-to-top';
import {
	CHECKOUT_ALLOWS_GUEST,
	CHECKOUT_ALLOWS_SIGNUP,
	CURRENT_USER_IS_ADMIN,
} from '@woocommerce/block-settings';
import { compareWithWooVersion, getSetting } from '@woocommerce/settings';
import { PluginArea } from '@wordpress/plugins';
import BlockErrorBoundary from '@woocommerce/base-components/block-error-boundary';

/**
 * Internal dependencies
 */
import CheckoutForm from './form';
import CheckoutSidebar from './sidebar';
import CheckoutOrderError from './checkout-order-error';
import { LOGIN_TO_CHECKOUT_URL } from './utils';
import './style.scss';

/**
 * Renders the Checkout block wrapped within the CheckoutProvider.
 *
 * @param {Object} props Component props.
 * @return {*} The component.
 */
const Block = ( props ) => {
	return (
		<CheckoutProvider>
			<Checkout { ...props } />
			{ /* If the current user is an admin, we let BlockErrorBoundary render
			the error, or we simply die silently. */ }
			<BlockErrorBoundary
				render={ CURRENT_USER_IS_ADMIN ? null : () => null }
			>
				<PluginArea />
			</BlockErrorBoundary>
		</CheckoutProvider>
	);
};

/**
 * Main Checkout Component.
 *
 * @param {Object} props Component props.
 * @param {Object} props.attributes Incoming block attributes.
 * @param {function(any):any} props.scrollToTop Function for scrolling to top.
 */
const Checkout = ( { attributes, scrollToTop } ) => {
	const { isEditor } = useEditorContext();
	const {
		cartItems,
		cartTotals,
		cartCoupons,
		cartNeedsPayment,
	} = useStoreCart();
	const {
		hasOrder,
		hasError: checkoutHasError,
		isIdle: checkoutIsIdle,
		customerId,
	} = useCheckoutContext();
	const {
		hasValidationErrors,
		showAllValidationErrors,
	} = useValidationContext();
	const { hasNoticesOfType } = useStoreNotices();

	const hasErrorsToDisplay =
		checkoutIsIdle &&
		checkoutHasError &&
		( hasValidationErrors || hasNoticesOfType( 'default' ) );

	// Checkout signup is feature gated to WooCommerce 4.7 and newer;
	// uses updated my-account/lost-password screen from 4.7+ for
	// setting initial password.
	const allowCreateAccount =
		attributes.allowCreateAccount && compareWithWooVersion( '4.7.0', '<=' );

	useEffect( () => {
		if ( hasErrorsToDisplay ) {
			showAllValidationErrors();
			scrollToTop( { focusableSelector: 'input:invalid' } );
		}
	}, [ hasErrorsToDisplay, scrollToTop, showAllValidationErrors ] );

	if ( ! isEditor && ! hasOrder ) {
		return <CheckoutOrderError />;
	}

	if (
		! isEditor &&
		! customerId &&
		! CHECKOUT_ALLOWS_GUEST &&
		! ( allowCreateAccount && CHECKOUT_ALLOWS_SIGNUP )
	) {
		return (
			<>
				{ __(
					'You must be logged in to checkout. ',
					'woo-gutenberg-products-block'
				) }
				<a href={ LOGIN_TO_CHECKOUT_URL }>
					{ __(
						'Click here to log in.',
						'woo-gutenberg-products-block'
					) }
				</a>
			</>
		);
	}
	const checkoutClassName = classnames( 'wc-block-checkout', {
		'has-dark-controls': attributes.hasDarkControls,
	} );
	return (
		<>
			<SidebarLayout className={ checkoutClassName }>
				<Main className="wc-block-checkout__main">
					{ cartNeedsPayment && <CheckoutExpressPayment /> }
					<CheckoutForm
						showApartmentField={ attributes.showApartmentField }
						showCompanyField={ attributes.showCompanyField }
						showOrderNotes={ attributes.showOrderNotes }
						showPhoneField={ attributes.showPhoneField }
						requireCompanyField={ attributes.requireCompanyField }
						requirePhoneField={ attributes.requirePhoneField }
						allowCreateAccount={ allowCreateAccount }
					/>
					<div className="wc-block-checkout__actions">
						{ attributes.showReturnToCart && (
							<ReturnToCartButton
								link={ getSetting(
									'page-' + attributes?.cartPageId,
									false
								) }
							/>
						) }
						<PlaceOrderButton />
					</div>
					{ attributes.showPolicyLinks && <Policies /> }
				</Main>
				<Sidebar className="wc-block-checkout__sidebar">
					<CheckoutSidebar
						cartCoupons={ cartCoupons }
						cartItems={ cartItems }
						cartTotals={ cartTotals }
					/>
				</Sidebar>
			</SidebarLayout>
		</>
	);
};

export default withScrollToTop( Block );
