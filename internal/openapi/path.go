package openapi

import "strings"

type pathKind int

const (
	pathKindOperation pathKind = iota
	pathKindRequestBodyRequired
	pathKindResponseSchemaType
	pathKindParameter
	pathKindSchemaProperty
	pathKindSchemaRequired
)

var supportedMethods = []string{
	"get",
	"put",
	"post",
	"delete",
	"options",
	"head",
	"patch",
	"trace",
}

type pathRef struct {
	apiPath     string
	method      string
	kind        pathKind
	statusCode  string
	contentType string
	paramIn     string
	paramName   string
	section     string // "requestBody" or "responses.{status}.content.{type}"
	propName    string
}

func operationPath(apiPath, method string) pathRef {
	return pathRef{
		apiPath: apiPath,
		method:  strings.ToLower(method),
		kind:    pathKindOperation,
	}
}

func requestBodyRequiredPath(apiPath, method string) pathRef {
	return pathRef{
		apiPath: apiPath,
		method:  strings.ToLower(method),
		kind:    pathKindRequestBodyRequired,
	}
}

func responseSchemaTypePath(apiPath, method, statusCode, contentType string) pathRef {
	return pathRef{
		apiPath:     apiPath,
		method:      strings.ToLower(method),
		kind:        pathKindResponseSchemaType,
		statusCode:  statusCode,
		contentType: contentType,
	}
}

func parameterPath(apiPath, method, in, name string) pathRef {
	return pathRef{
		apiPath:   apiPath,
		method:    strings.ToLower(method),
		kind:      pathKindParameter,
		paramIn:   in,
		paramName: name,
	}
}

func schemaPropertyPath(apiPath, method, section, propName string) pathRef {
	return pathRef{
		apiPath:  apiPath,
		method:   strings.ToLower(method),
		kind:     pathKindSchemaProperty,
		section:  section,
		propName: propName,
	}
}

func schemaRequiredPath(apiPath, method, section, propName string) pathRef {
	return pathRef{
		apiPath:  apiPath,
		method:   strings.ToLower(method),
		kind:     pathKindSchemaRequired,
		section:  section,
		propName: propName,
	}
}

func isSupportedMethod(method string) bool {
	method = strings.ToLower(method)
	for _, supported := range supportedMethods {
		if method == supported {
			return true
		}
	}
	return false
}

func (p pathRef) raw() string {
	base := "paths." + p.apiPath + "." + p.method

	switch p.kind {
	case pathKindOperation:
		return base
	case pathKindRequestBodyRequired:
		return base + ".requestBody.required"
	case pathKindResponseSchemaType:
		return base + ".responses." + p.statusCode + ".content." + p.contentType + ".schema.type"
	case pathKindParameter:
		return base + ".parameters." + p.paramIn + "." + p.paramName
	case pathKindSchemaProperty:
		return base + "." + p.section + ".schema.properties." + p.propName
	case pathKindSchemaRequired:
		return base + "." + p.section + ".schema.required." + p.propName
	default:
		return base
	}
}

func (p pathRef) human() string {
	method := strings.ToUpper(p.method)

	switch p.kind {
	case pathKindOperation:
		return method + " " + p.apiPath
	case pathKindRequestBodyRequired:
		return method + " " + p.apiPath + " request body required"
	case pathKindResponseSchemaType:
		return method + " " + p.apiPath + " response " + p.statusCode + " " + p.contentType + " schema type"
	case pathKindParameter:
		return method + " " + p.apiPath + " parameter " + p.paramIn + " " + p.paramName
	case pathKindSchemaProperty:
		return method + " " + p.apiPath + " " + p.section + " schema property " + p.propName
	case pathKindSchemaRequired:
		return method + " " + p.apiPath + " " + p.section + " schema required " + p.propName
	default:
		return p.raw()
	}
}

func parsePathRef(path string) (pathRef, bool) {
	const prefix = "paths."
	if !strings.HasPrefix(path, prefix) {
		return pathRef{}, false
	}

	body := path[len(prefix):]
	apiPath, method, rest, ok := splitMethodPath(body)
	if !ok {
		return pathRef{}, false
	}

	switch {
	case rest == "":
		return operationPath(apiPath, method), true
	case rest == ".requestBody.required":
		return requestBodyRequiredPath(apiPath, method), true
	case strings.HasPrefix(rest, ".parameters."):
		tail := strings.TrimPrefix(rest, ".parameters.")
		dotIdx := strings.Index(tail, ".")
		if dotIdx <= 0 {
			return pathRef{}, false
		}
		paramIn := tail[:dotIdx]
		paramName := tail[dotIdx+1:]
		if paramName == "" {
			return pathRef{}, false
		}
		return parameterPath(apiPath, method, paramIn, paramName), true
	case strings.HasPrefix(rest, ".responses."):
		tail := strings.TrimPrefix(rest, ".responses.")
		const contentToken = ".content."
		contentIdx := strings.Index(tail, contentToken)
		if contentIdx <= 0 {
			return pathRef{}, false
		}

		statusCode := tail[:contentIdx]
		contentAndSuffix := tail[contentIdx+len(contentToken):]
		const schemaTypeSuffix = ".schema.type"
		if strings.HasSuffix(contentAndSuffix, schemaTypeSuffix) {
			contentType := strings.TrimSuffix(contentAndSuffix, schemaTypeSuffix)
			if contentType == "" {
				return pathRef{}, false
			}
			return responseSchemaTypePath(apiPath, method, statusCode, contentType), true
		}

		const schemaPropToken = ".schema.properties." //nolint:gosec // G101: not a credential
		schemaIdx := strings.Index(contentAndSuffix, schemaPropToken)
		if schemaIdx >= 0 {
			contentType := contentAndSuffix[:schemaIdx]
			propName := contentAndSuffix[schemaIdx+len(schemaPropToken):]
			if contentType == "" || propName == "" {
				return pathRef{}, false
			}
			section := "responses." + statusCode + ".content." + contentType
			return schemaPropertyPath(apiPath, method, section, propName), true
		}

		const schemaReqToken = ".schema.required."
		reqIdx := strings.Index(contentAndSuffix, schemaReqToken)
		if reqIdx >= 0 {
			contentType := contentAndSuffix[:reqIdx]
			propName := contentAndSuffix[reqIdx+len(schemaReqToken):]
			if contentType == "" || propName == "" {
				return pathRef{}, false
			}
			section := "responses." + statusCode + ".content." + contentType
			return schemaRequiredPath(apiPath, method, section, propName), true
		}

		return pathRef{}, false
	case strings.HasPrefix(rest, ".requestBody."):
		tail := strings.TrimPrefix(rest, ".requestBody.")
		const schemaPropToken = "schema.properties." //nolint:gosec // G101: not a credential
		if strings.HasPrefix(tail, schemaPropToken) {
			propName := strings.TrimPrefix(tail, schemaPropToken)
			if propName == "" {
				return pathRef{}, false
			}
			return schemaPropertyPath(apiPath, method, "requestBody", propName), true
		}
		const schemaReqToken = "schema.required."
		if strings.HasPrefix(tail, schemaReqToken) {
			propName := strings.TrimPrefix(tail, schemaReqToken)
			if propName == "" {
				return pathRef{}, false
			}
			return schemaRequiredPath(apiPath, method, "requestBody", propName), true
		}
		return pathRef{}, false
	}

	return pathRef{}, false
}

func splitMethodPath(body string) (apiPath, method, rest string, ok bool) {
	bestIdx := -1
	bestMethod := ""
	bestEnd := -1

	for _, m := range supportedMethods {
		pattern := "." + m
		searchPos := 0

		for {
			idx := strings.Index(body[searchPos:], pattern)
			if idx < 0 {
				break
			}
			idx += searchPos
			end := idx + len(pattern)

			if end == len(body) || body[end] == '.' {
				if idx > bestIdx {
					bestIdx = idx
					bestMethod = m
					bestEnd = end
				}
			}

			searchPos = idx + 1
		}
	}

	if bestIdx <= 0 || bestMethod == "" {
		return "", "", "", false
	}

	return body[:bestIdx], bestMethod, body[bestEnd:], true
}
