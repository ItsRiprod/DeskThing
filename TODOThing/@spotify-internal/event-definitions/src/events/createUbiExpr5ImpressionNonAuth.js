// NOTE: This code was generated and should not be changed
/**
 * A builder for UbiExpr5ImpressionNonAuth
 *
 * @param data - The event data
 * @return The formatted event data for UbiExpr5ImpressionNonAuthEvent
 */
export function createUbiExpr5ImpressionNonAuth(data) {
    return {
        name: 'UbiExpr5ImpressionNonAuth',
        environments: ['devicenonauth', 'browsernonauth', 'desktopnonauth'],
        data,
    };
}
